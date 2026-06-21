from contextlib import asynccontextmanager
from enum import Enum
from fastapi import FastAPI, HTTPException
from sqlmodel import SQLModel, Field, create_engine, select, Session, Column, Enum as SQLEnum


# uvicorn main:app --reload
# fastapi dev main.py



# SQL Model setup
"""
Notes:
- SQLModel is a library that combines the features of SQLAlchemy and Pydantic.
"""
# Defining fixed enum values for 'priority' field
class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

# ---------

class TaskBase(SQLModel):
    title: str = Field(index=True)
    due_date: str | None = Field(default=None, index=True)
    priority: TaskPriority = Field(
        sa_column=Column(SQLEnum(TaskPriority), nullable=False, default=TaskPriority.MEDIUM)
        )
    completed: bool = Field(default=False)

# since table=True, this class will be used to create a table in the database., and id is optional because when we create a new task (using CreateTask), 
# we don't have an ID for it yet, and we want the database to generate the ID automatically for us.
class Task(TaskBase, table=True):
    id: int | None = Field(default=None, primary_key=True)

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
    due_date: str | None = None
    priority: str | None = None
    completed: bool | None = None



sqlite_file_name = "database.db"  
sqlite_url = f"sqlite:///{sqlite_file_name}"
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, echo=True, connect_args=connect_args)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield
    # Any cleanup code can go here if needed


app = FastAPI(lifespan=lifespan)

# reponse_model=TaskPublic defines the schema / format of the response that this endpoint will return.
@app.post("/tasks", response_model=TaskPublic)
def create_task(task: TaskCreate):
    with Session(engine) as session:
        # In this case, we have a TaskCreate instance in the task variable. This is an object with attributes, so we use .model_validate() to read those attributes. 
        # We then create a Task instance, which is the SQLModel class that corresponds to our database table. This Task instance is what we add to the session and commit to the database.
        db_task = Task.model_validate(task)
        session.add(db_task)
        session.commit()
        # Because it is just refreshed, it has the id field set with a new ID taken from the database.
        session.refresh(db_task)
        # And now that we return it, FastAPI will validate the data with the response_model, which is a TaskPublic instance, and convert it to JSON to send back to the client.
        return db_task
    

@app.get("/tasks", response_model=list[TaskPublic])
def read_tasks():
    with Session(engine) as session:
        tasks = session.exec(select(Task)).all()
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
