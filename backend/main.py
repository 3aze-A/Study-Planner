from __future__ import annotations
from contextlib import asynccontextmanager
from enum import Enum
import json
from fastapi import FastAPI, HTTPException, Depends, status, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationInfo, field_validator, ValidationError
from sqlmodel import SQLModel, Field, create_engine, select, Session, Column, Enum as SQLEnum
import sqlalchemy
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, UTC, timedelta
from dotenv import load_dotenv
from jose import jwt
from jose.exceptions import JWTError
from typing import Annotated
from docx import Document
from docx.document import Document as DocumentClass
from docx.oxml.ns import qn
from docx.text.paragraph import Paragraph
from docx.table import Table
import os
import bcrypt
import pdfplumber
import io
import base64


# source venv/bin/activate
# uvicorn main:app --reload
# fastapi dev main.py



# something@gmail.com, pwd123
# example@gmail.com, pwd456



# SQL Model setup
"""
Notes:
- SQLModel is a library that combines the features of SQLAlchemy and Pydantic.
"""
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")


# User Model
class UserBase(SQLModel):
    email: str = Field(index=True, sa_column_kwargs={"unique": True})


class User(UserBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    hashed_password: str


class UserCreate(UserBase):
    password: str


class UserPublic(UserBase):
    id: int


class UserLoginPublic(UserBase):
    id: int
    token: str

# May implement later
# class UserUpdate(SQLModel):
#     email: str | None = None
#     password: str | None = None


# Hashing password
def hash_password(password: str) -> str:
    encoded_password = password.encode('utf-8')
    hashed_password = bcrypt.hashpw(encoded_password, bcrypt.gensalt())
    return hashed_password.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    encoded_password = plain_password.encode('utf-8')
    
    return bcrypt.checkpw(encoded_password, hashed_password.encode('utf-8'))


def create_access_token(user_id: int) -> str:
    payload_data = {
        "user_id": user_id,
        "exp": datetime.now(UTC) + timedelta(hours=2)
    }

    # Creates a JWT token
    return jwt.encode(payload_data, SECRET_KEY, algorithm="HS256")


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    # This catches signature failures, malformed tokens, and claim failures
    except JWTError:
        raise credentials_exception
    return user_id



# ---------


# Defining fixed enum values for 'priority' field
class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

# ---------

class TaskBase(SQLModel):
    course: str = Field(index=True)
    description: str | None = Field(default=None)
    due_date: str | None = Field(default=None, index=True)
    priority: TaskPriority = Field(
        sa_column=Column(SQLEnum(TaskPriority), nullable=False, default=TaskPriority.MEDIUM)
        )
    estimated_time: int = Field(default=30)
    completed: bool = Field(default=False)

    @field_validator("due_date")
    @classmethod
    def validate_due_date(cls, value: str, info: ValidationInfo) -> str:
        if value is not None:
            try:
                datetime.strptime(value, "%Y-%m-%d")
            except ValueError:
                raise ValueError("due_date must be in YYYY-MM-DD format")
        return value

# since table=True, this class will be used to create a table in the database., and id is optional because when we create a new task (using CreateTask), 
# we don't have an ID for it yet, and we want the database to generate the ID automatically for us.
class Task(TaskBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int | None = Field(default=None, foreign_key="user.id")

# We could easily decide in the future that we want to receive more data when creating a new task 
# apart from the data in TaskBase (for example, a password), and now we already have the class to put those extra fields.

class TaskCreate(TaskBase):
    pass

# This declares that the id field is required when reading a task from the API, because a task read from the API will 
# come from the database, and in the database it will always have an ID.
class TaskPublic(TaskBase):
    id: int

# This is almost the same as TaskBase, but all the fields are optional, so we can't simply inherit from TaskBase.
class TaskUpdate(SQLModel):
    course: str | None = None
    description: str | None = None
    due_date: str | None = None
    priority: str | None = None
    estimated_time: int | None = None
    completed: bool | None = None






sqlite_file_name = "database.db"  
sqlite_url = f"sqlite:///{sqlite_file_name}"
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, echo=True, connect_args=connect_args)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

#-------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield
    # Any cleanup code can go here if needed


app = FastAPI(lifespan=lifespan)
# Allowing certain origins to share resources
# Allowing the frontend to connect to the backend
origins = [
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#-------------------------------------------------------

# reponse_model=TaskPublic defines the schema / format of the response that this endpoint will return.
@app.post("/tasks", response_model=TaskPublic)
def create_task(task: TaskCreate, user_id: int = Depends(get_current_user_id)):
    with Session(engine) as session:
        # In this case, we have a TaskCreate instance in the task variable. This is an object with attributes, so we use .model_validate() to read those attributes. 
        # We then create a Task instance, which is the SQLModel class that corresponds to our database table. This Task instance is what we add to the session and commit to the database.
        db_task = Task.model_validate(task)
        db_task.user_id = user_id
        session.add(db_task)
        session.commit()
        # Because it is just refreshed, it has the id field set with a new ID taken from the database.
        session.refresh(db_task)
        # And now that we return it, FastAPI will validate the data with the response_model, which is a TaskPublic instance, and convert it to JSON to send back to the client.
        return db_task
    

@app.get("/tasks", response_model=list[TaskPublic])
def read_tasks(user_id: int = Depends(get_current_user_id)):  # Depends(get_current_user_id) will extract the user_id from the JWT token sent by the client in the Authorization header.
    with Session(engine) as session:
        tasks = session.exec(select(Task).where(Task.user_id == user_id)).all()
        return tasks
    

@app.get("/tasks/{task_id}", response_model=TaskPublic)
def read_task(task_id: int):
    with Session(engine) as session:
        task = session.get(Task, task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task


@app.patch("/tasks/{task_id}", response_model=TaskPublic)
def update_task(task_id: int, task: TaskUpdate):
    # This is to make
    with Session(engine) as session:
        db_task = session.get(Task, task_id)
        if not db_task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # exclude_unset=True tells Pydantic to not include the values that were not sent by the client
        task_data = task.model_dump(exclude_unset=True)
        db_task.sqlmodel_update(task_data)
        session.add(db_task)
        session.commit()
        session.refresh(db_task)
        return db_task
    

@app.delete("/tasks/{task_id}")
def delete(task_id: int):
    with Session(engine) as session:
        task = session.get(Task, task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        session.delete(task)
        session.commit()
        return {"message": f"Task with id {task_id} has been deleted."}
    


##########################################
# REGISTRATION/LOG-IN PROCESS
##########################################

@app.post("/register", response_model=UserPublic)
def create_user(user: UserCreate):
    with Session(engine) as session:
        statement = select(User).where(User.email == user.email)
        existing_user = session.exec(statement).first()
        # Check if a user record was actually returned
        if existing_user:
            raise HTTPException(status_code=409, detail="Email is already used. Please log-in.")
        
        # If email is not already in use
        hashed_password = hash_password(user.password)
        extra_data = {"hashed_password": hashed_password}
        db_user = User.model_validate(user, update=extra_data)
        session.add(db_user)
        session.commit()
        # Because it is just refreshed, it has the id field set with a new ID taken from the database.
        session.refresh(db_user)
        # And now that we return it, FastAPI will validate the data with the response_model, which is a TaskPublic instance, and convert it to JSON to send back to the client.
        return db_user
    

@app.post("/login", response_model=UserLoginPublic)
def login_attempt(user: UserCreate):
    with Session(engine) as session:
        statement = select(User).where(User.email == user.email)
        existing_user = session.exec(statement).first()
        if not existing_user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        if verify_password(user.password, existing_user.hashed_password):
            # return a UserLoginPublic with a JWT - JSON Web Token - to the client to use on future requests
            token = create_access_token(existing_user.id)
            return UserLoginPublic(id=existing_user.id, email=existing_user.email, token=token)
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password")



##########################################
# File Upload Process
##########################################
import instructor
from pydantic import BaseModel, Field
from anthropic import Anthropic

class SyllabusImportResult(BaseModel):
        created: list[TaskPublic] = Field(default_factory=list)
        skipped: list[str] = Field(default_factory=list)


# course: str | None = None
# description: str | None = None
# due_date: str | None = None
# priority: str | None = None
# estimated_time: int | None = None
# completed: bool | None = None


CLAUDE_PROMPT = """
You are a precise syllabus parsing engine designed to extract academic timeline data. 
Your task is to analyze the provided course syllabus and convert every assignment, exam, 
and milestone into a highly accurate data structure.

Return only an object of two keys, each mapping to a list of objects. Do not include any preamble, markdown code blocks, 
or conversational notes. 

Each object in the "categories" list must strictly use the following schema: 
{'name': string, 'percent': float | null}

Each object in the "items" list must strictly use the following schema: 
{'course': string, 'description': string, 'due_date': string | null, 'estimated_time': integer, 'category': string}

Only include a category in the "categories" list if it produced at least one item in the 
"items" list. Categories that were excluded entirely (e.g. ongoing participation with no 
discrete due date) must not appear in "categories" either.

Note:
- The worked example below shows the complete expected output for the given input, not an 
abbreviated one. Never include a literal ellipsis ("...") in your actual output — always 
produce the complete, real JSON for the document you were given.
- The 'estimated_time' field must be an integer representing the estimated time in minutes to complete 
the task, and must be a multiple of 30, with a maximum of 240.
- The 'description' field must be a string describing the assignment or event.
- The 'course' field must be a string representing the course code (e.g., "MAT135").
- The 'due_date' field must be in the format YYYY-MM-DD.
- The 'category' field must match exactly the respective category name of that item from the input.
- The source text may come from a table, a bulleted list, or plain prose describing grade 
weighting. The grading information may be formatted in any way. Read the whole document 
carefully to find it regardless of its structure or heading name (e.g. "Marking Scheme", 
"Grading Breakdown", "Assessment, Evaluation, and Grading", etc.). You may need to find the 
respective due dates for each item in the syllabus, which may be listed in a separate table or section.
- Find the "course" name in the syllabus, usually in the header or title section of the first page. If 
the course name is not explicitly stated, use "Unknown Course" as the default value.

Extraction Rules:
Only create a card for discrete, dated, actionable items.
Any item with an ongoing due date, written explicitly or implicitly (e.g. "Ongoing", "N/A", 
weekly participation with no single deadline), must not be included in "items" at all.
If an item has a real but currently-unscheduled due date (e.g. "Final Exam Period"), include 
it in "items" with a null due_date.

If an item has multiple due dates (e.g. weekly quizzes), split it into N separate items, one 
per date, indexed accordingly (Quiz 1, Quiz 2, etc.).

Items with no stated weight but a clear individual due date (e.g. Surveys) still get a card 
and still get an entry in "categories" with percent: null.

Tutorials, labs, and similar recurring meetings are not assignments unless the syllabus 
explicitly describes graded, individually-submitted work tied to them.

Determine the estimated_time of each item by yourself according to the assessment type or details; 
be realistic and dont overestimate or underestimate. If unable to predict a proper value, then 
default to 60. For example, a 'Survey' must take a minimum of 30 minutes, so estimated_time is 30.
However, estimated_time must be an integer with 30 minute intervales, example 30, or 60, or 90, and 
must not exceed 240.



Worked Example:
<example_input>
Marking Scheme
Assessment Percent Details Due Date
Preparation checks 5% Average of all except your lowest 
three. 
2025-09-08, 
2025-09-15, 
2025-09-22
MathMatize polls 4% Full marks for participating in at least 
80% of polls. 
Ongoing
Online assignments 7% Average of all except your lowest 
one. Online assignments will be 
completed on WebWorK. 
2025-09-14, 
2025-09-21
Term Test 1 19% Tests are written 5:10-7pm on 
Fridays. 
2025-10-03
Surveys 2% There will be a start-of-course survey
and an end-of-course survey. 
2025-09-15, 
2025-12-01
Final Assessment 40% Cumulative Final Exam. You must 
obtain a minimum grade of 35% on 
the final exam in order to pass the 
course.
Final Exam Period
</example_input>


<example_output>
{"categories": [{"name": "Preparation checks", "percent": 5.0}, {"name": "Online assignments", "percent": 7.0}, {"name": "Term Test 1", "percent": 19.0}, {"name": "Surveys", "percent": 2.0}, {"name": "Final Assessment", "percent": 40.0}], "items": [{"course": "MAT135", "description": "Preparation Check 1", "due_date": "2025-09-08", "estimated_time": 30, "category": "Preparation checks"}, {"course": "MAT135", "description": "Preparation Check 2", "due_date": "2025-09-15", "estimated_time": 30, "category": "Preparation checks"}, {"course": "MAT135", "description": "Preparation Check 3", "due_date": "2025-09-22", "estimated_time": 30, "category": "Preparation checks"}, {"course": "MAT135", "description": "Online Assignment 1", "due_date": "2025-09-14", "estimated_time": 60, "category": "Online assignments"}, {"course": "MAT135", "description": "Online Assignment 2", "due_date": "2025-09-21", "estimated_time": 60, "category": "Online assignments"}, {"course": "MAT135", "description": "Term Test 1", "due_date": "2025-10-03", "estimated_time": 120, "category": "Term Test 1"}, {"course": "MAT135", "description": "Survey 1", "due_date": "2025-09-15", "estimated_time": 30, "category": "Surveys"}, {"course": "MAT135", "description": "Survey 2", "due_date": "2025-12-01", "estimated_time": 30, "category": "Surveys"}, {"course": "MAT135", "description": "Final Assessment", "due_date": null, "estimated_time": 120, "category": "Final Assessment"}]}
</example_output>
"""


def extract_tables_from_pdf(file: io.BytesIO) -> list[list[str]]:
    # file_path = "MAT135 f25 - Syllabus.pdf"

    raw_rows = []
    target_found = False

    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""

            if "Marking Scheme" in text:
                target_found = True

            if target_found:
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        # Filter out duplicate table headers caused by page breaks
                        if row == ['Assessment', 'Percent', 'Details', 'Due Date']:
                            if len(raw_rows) > 0:
                                continue  # Skip repeated header on page 6
                        raw_rows.append(row)

                if "Overall Course Grading Policy" in text and len(raw_rows) > 0:
                    break

    # --- POST-PROCESSING: Merge broken rows across page boundaries ---
    cleaned_rows = []

    for row in raw_rows:
        # Check if this is an orphaned/continuation row (e.g., empty main fields)
        is_continuation = (
            cleaned_rows
            and ( not row[0].strip()  # Primary label ('Assessment') is empty
            or not row[1].strip()  # Secondary label ('Percent') is empty
            or not row[2].strip() ) # Third label ('Due Date') is empty
        )

        if is_continuation:
            # Merge cell contents into the previous row's corresponding columns
            previous_row = cleaned_rows[-1]
            for idx in range(len(row)):
                if row[idx].strip():
                    if previous_row[idx].strip():
                        previous_row[idx] += "\n" + row[idx].strip()
                    else:
                        previous_row[idx] = row[idx].strip()
        else:
            cleaned_rows.append(row)

    """
    Example Cleaned Rows Output:

    ['Assessment', 'Percent', 'Details', 'Due Date']
    ['Preparation checks', '5%', 'Average of all except your lowest\nthree.', '2025-09-08,\n2025-09-15,\n2025-09-22,\n2025-09-29,\n2025-10-06,\n2025-10-13,\n2025-10-20,\n2025-11-03,\n2025-11-10,\n2025-11-17,\n2025-11-24']
    ['MathMatize polls', '4%', 'Full marks for participating in at least\n80% of polls.', 'Ongoing']
    ['Online assignments', '7%', 'Average of all except your lowest\none. Online assignments will be\ncompleted on WebWorK.', '2025-09-14,\n2025-09-21,\n2025-09-28,\n2025-10-12,\n2025-10-19,\n2025-10-26,\n2025-11-09,\n2025-11-23,\n2025-11-30']
    ['Writing\nAssignments', '4%', 'There will be three "writing\nassignments" in the course. All three\nwill count towards your final grade.\nMore details will be available on\nQuercus later.', '2025-10-12,\n2025-11-09,\n2025-11-30']
    ['Term Test 1', '19%', 'If you write two term tests, your\nhighest test score will be worth 22%,\nand your lowest test score will be\nworth 16% (for an average of 19%).\nTests are written 5:10-7pm on\nFridays.', '2025-10-03']
    ['Term Test 2', '19%', 'If you write two term tests, your\nhighest test score will be worth 22%,\nand your lowest test score will be\nworth 16% (for an average of 19%).\nTests are written 5:10-7pm on\nFridays.', '2025-11-14']
    ['Surveys', '2%', 'There will be a start-of-course survey\nand an end-of-course survey. You\nmust complete the surveys by the\ndue date to get the associated grade.', '2025-09-15,\n2025-12-01']
    ['Final Assessment', '40%', 'Cumulative Final Exam. You must\nobtain a minimum grade of 35% on\nthe final exam in order to pass the\ncourse.', 'Final Exam Period']
    """

    return cleaned_rows


def _category_percent(data) -> dict:
    res = {}
    for row in data:
        if row == ['Assessment', 'Percent', 'Details', 'Due Date']:
            continue
        res[row[0].replace("\n", " ").strip()] = float(row[1].strip('%'))

    return res


def _compute_priority(percent: float, item_count: int) -> str:
    res = percent / item_count

    if res < 1:
        return "low"
    elif res >= 1 and res < 5:
        return "medium"
    else:
        return "high"


def _strip_markdown_fence(text: str):
    """ Strip ```json from the left, and ``` from the right, as well as any remaining whitespace. """
    res = text
    if text.startswith("```json"):
        res = text.removeprefix("```json").strip()
    if text.endswith("```"):
        res = res.removesuffix("```").strip()

    return res


def extract_text_from_pdf(file: io.BytesIO) -> str:
    res = ""
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            res += (page.extract_text() or "") + "\n"

    return res



def _paragraph_text(paragraph) -> str:
    """Get all text in a paragraph, including text nested inside
    content controls, hyperlinks, or other wrapping elements."""
    return "".join(node.text or "" for node in paragraph._p.iter(qn('w:t')))


def _iter_block_items(parent):
    """
    Yield each paragraph and table child within `parent`, in order.
    `parent` is typically a Document object or a TableCell object.
    """
    if isinstance(parent, DocumentClass):
        parent_elm = parent.element.body
    elif hasattr(parent, '_tc'):
        parent_elm = parent._tc
    else:
        raise TypeError('Unsupported parent type')

    for child in parent_elm.iterchildren():
        if child.tag.endswith('p'):
            yield Paragraph(child, parent)
        elif child.tag.endswith('tbl'):
            yield Table(child, parent)


def extract_text_from_docx(file: io.BytesIO) -> str:
    doc = Document(file)
    document_text = ""

    # for child in doc.element.body.iterchildren():
    #     print(f"Child tag: {child.tag}")


    for block in _iter_block_items(doc):
        if isinstance(block, Paragraph):
            document_text += _paragraph_text(block) + "\n"
        elif isinstance(block, Table):
            # recursively extract all text from the table cells in order
            for row in block.rows:
                for cell in row.cells:
                    for cell_block in _iter_block_items(cell):
                        if isinstance(cell_block, Paragraph):
                            document_text += _paragraph_text(cell_block) + " "
                document_text += "\n"  # new line after each row

    return document_text.strip()  # Remove any trailing whitespace






@app.post("/uploadfile/", response_model=SyllabusImportResult)
async def create_upload_file(uploaded_file: UploadFile, user_id: int = Depends(get_current_user_id)):
    ##########################################
    # API Integration
    ##########################################

    # cleaned_rows = extract_tables_from_pdf(binary_stream)
    if uploaded_file.content_type == "application/pdf":
        file = io.BytesIO(await uploaded_file.read())

        content = f"Analyze the text wrapped inside the XML tags below and execute the extraction rules: <syllabus_text> {extract_text_from_pdf(file)} </syllabus_text>"
    elif uploaded_file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        file = io.BytesIO(await uploaded_file.read())
        syllabus_text = extract_text_from_docx(file)
        content = f"Analyze the text wrapped inside the XML tags below and execute the extraction rules: <syllabus_text> {syllabus_text} </syllabus_text>"
    elif uploaded_file.content_type in ("image/png", "image/jpeg", "image/jpg"):
        # No local extraction at all. Pass the image bytes straight to Claude.
        image_bytes = await uploaded_file.read()
        image_b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
        
        content = [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": uploaded_file.content_type,  # e.g "image/png"
                    "data": image_b64
                }
            },
            {
                "type": "text",
                "text": "Analyze the syllabus image above and execute the extraction rules"
            }
        ]
    else:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {uploaded_file.content_type}")


    # print(f"Raw text sent to Claude: length {len(syllabus_text)} chars:\n{syllabus_text[:500]}\n")


    client = Anthropic(api_key=ANTHROPIC_API_KEY)

    message = client.messages.create(
        model = "claude-haiku-4-5-20251001",
        max_tokens=2048,
        system=CLAUDE_PROMPT,
        messages = [{
            "role": "user",
            "content": content
        }]
    )

    # clean the cards from any markdown from Claude
    cards_list = _strip_markdown_fence(message.content[0].text)


    try:
        # Parse the cards in json
        parsed = json.loads(cards_list)
    except json.JSONDecodeError:
        # print(f"Failed to parse JSON: {cards_list}\n")
        raise HTTPException(status_code=502, detail="Failed to parse the entire output batch.")


    # print(f"Parsed JSON: {parsed}\n")

    categories = parsed["categories"]
    items = parsed["items"]

    # Map each category name to its percent / total weightage
    category_percent_dict = {c["name"]: c["percent"] for c in categories}

    # Creating a dict to count the number of items in each category
    category_count_dict = {}
    for item in items:
        category_count_dict[item["category"].replace("\n", " ").strip()] = category_count_dict.get(item["category"].replace("\n", " ").strip(), 0) + 1


    created_items = []
    skipped_items = []

    for item in items:
        category = item["category"].replace("\n", " ").strip()
        percent = category_percent_dict.get(category)
        count = category_count_dict.get(category)

        if percent is None or count is None:
            skipped_items.append(f"{item.get('description', 'Unknown item')}. Because category not found in syllabus: {category}")
            continue

        item["priority"] = _compute_priority(percent, count)
        
        try:
            validated_task = TaskCreate.model_validate(item)
            created_items.append(validated_task)
        except ValidationError as e:
            skipped_items.append(f"{item.get('description', 'Unknown item')}: {e}")


    # items with assigned ids after each session refresh.
    updated_items = []
    db_tasks = []

    with Session(engine) as session:
        for task in created_items:
            db_task = Task.model_validate(task)
            db_task.user_id = user_id
            session.add(db_task)
            db_tasks.append(db_task)

        try:
            session.commit()
        except  sqlalchemy.exc.SQLAlchemyError:
            raise HTTPException(status_code=500, detail="Failed to commit all the tasks into the database")

        for db_task in db_tasks:
            session.refresh(db_task)
            updated_items.append(db_task)


    return SyllabusImportResult(created=updated_items, skipped=skipped_items)





"""
Recent Output:

{"created":[{"course":"MAT135","description":"Preparation check 1","due_date":"2025-09-08","priority":"low","estimated_time":30,"completed":false,"id":2},{"course":"MAT135","description":"Preparation check 2","due_date":"2025-09-15","priority":"low","estimated_time":30,"completed":false,"id":3},{"course":"MAT135","description":"Preparation check 3","due_date":"2025-09-22","priority":"low","estimated_time":30,"completed":false,"id":4},{"course":"MAT135","description":"Preparation check 4","due_date":"2025-09-29","priority":"low","estimated_time":30,"completed":false,"id":5},{"course":"MAT135","description":"Preparation check 5","due_date":"2025-10-06","priority":"low","estimated_time":30,"completed":false,"id":6},{"course":"MAT135","description":"Preparation check 6","due_date":"2025-10-13","priority":"low","estimated_time":30,"completed":false,"id":7},{"course":"MAT135","description":"Preparation check 7","due_date":"2025-10-20","priority":"low","estimated_time":30,"completed":false,"id":8},{"course":"MAT135","description":"Preparation check 8","due_date":"2025-11-03","priority":"low","estimated_time":30,"completed":false,"id":9},{"course":"MAT135","description":"Preparation check 9","due_date":"2025-11-10","priority":"low","estimated_time":30,"completed":false,"id":10},{"course":"MAT135","description":"Preparation check 10","due_date":"2025-11-17","priority":"low","estimated_time":30,"completed":false,"id":11},{"course":"MAT135","description":"Preparation check 11","due_date":"2025-11-24","priority":"low","estimated_time":30,"completed":false,"id":12},{"course":"MAT135","description":"Online Assignment 1","due_date":"2025-09-14","priority":"low","estimated_time":60,"completed":false,"id":13},{"course":"MAT135","description":"Online Assignment 2","due_date":"2025-09-21","priority":"low","estimated_time":60,"completed":false,"id":14},{"course":"MAT135","description":"Online Assignment 3","due_date":"2025-09-28","priority":"low","estimated_time":60,"completed":false,"id":15},{"course":"MAT135","description":"Online Assignment 4","due_date":"2025-10-12","priority":"low","estimated_time":60,"completed":false,"id":16},{"course":"MAT135","description":"Online Assignment 5","due_date":"2025-10-19","priority":"low","estimated_time":60,"completed":false,"id":17},{"course":"MAT135","description":"Online Assignment 6","due_date":"2025-10-26","priority":"low","estimated_time":60,"completed":false,"id":18},{"course":"MAT135","description":"Online Assignment 7","due_date":"2025-11-09","priority":"low","estimated_time":60,"completed":false,"id":19},{"course":"MAT135","description":"Online Assignment 8","due_date":"2025-11-23","priority":"low","estimated_time":60,"completed":false,"id":20},{"course":"MAT135","description":"Online Assignment 9","due_date":"2025-11-30","priority":"low","estimated_time":60,"completed":false,"id":21},{"course":"MAT135","description":"Writing Assignment 1","due_date":"2025-10-12","priority":"medium","estimated_time":90,"completed":false,"id":22},{"course":"MAT135","description":"Writing Assignment 2","due_date":"2025-11-09","priority":"medium","estimated_time":90,"completed":false,"id":23},{"course":"MAT135","description":"Writing Assignment 3","due_date":"2025-11-30","priority":"medium","estimated_time":90,"completed":false,"id":24},{"course":"MAT135","description":"Term Test 1","due_date":"2025-10-03","priority":"high","estimated_time":120,"completed":false,"id":25},{"course":"MAT135","description":"Term Test 2","due_date":"2025-11-14","priority":"high","estimated_time":120,"completed":false,"id":26},{"course":"MAT135","description":"Survey 1","due_date":"2025-09-15","priority":"medium","estimated_time":30,"completed":false,"id":27},{"course":"MAT135","description":"Survey 2","due_date":"2025-12-01","priority":"medium","estimated_time":30,"completed":false,"id":28},{"course":"MAT135","description":"Final Assessment","due_date":null,"priority":"high","estimated_time":120,"completed":false,"id":29}],"skipped":[]}
"""

