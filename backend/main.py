from __future__ import annotations
from contextlib import asynccontextmanager
from enum import Enum
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Field, create_engine, select, Session, Column, Enum as SQLEnum
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, UTC, timedelta
from dotenv import load_dotenv
from jose import jwt
from jose.exceptions import JWTError
from typing import Annotated
import os
import bcrypt


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
    title: str = Field(index=True)
    description: str | None = Field(default=None)
    due_date: str | None = Field(default=None, index=True)
    priority: TaskPriority = Field(
        sa_column=Column(SQLEnum(TaskPriority), nullable=False, default=TaskPriority.MEDIUM)
        )
    completed: bool = Field(default=False)

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
    title: str | None = None
    description: str | None = None
    due_date: str | None = None
    priority: str | None = None
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
def read_tasks(user_id: int = Depends(get_current_user_id)):
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


