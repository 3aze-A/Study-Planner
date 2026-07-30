import TaskCard from "../components/TaskCard"
import {useState, useEffect, useContext} from "react"
import {getTasks, createTask, updateCompleted, updateTask} from "../services/api"
import "/Users/macblu/Downloads/VS Code Projects/Full-Stack Study Planner/frontend/src/Home.css"
import {AuthContext} from "../services/AuthContext"

// @ts-check

// @ts-ignore

function Home() {
  const [searchQuery, setSearchQuery]   = useState("")
  const [tasks, setTasks]               = useState([])
  const [error, setError]               = useState(null)
  const [loading, setLoading]           = useState(true)
  // Modal is the Add Task form
  const [isModalOpen, setIsModalOpen]   = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState(null)
 
  // Add Task form fields
  const [titleQuery, setTitleQuery]           = useState("")
  const [descriptionQuery, setDescriptionQuery] = useState("")
  const [duedateQuery, setDueDateQuery]       = useState("")
  const [priorityQuery, setPriorityQuery]     = useState("medium")
 
  useEffect(() => {
    const loadStoredTasks = async () => {
      try {
        const storedTasks = await getTasks()
        setTasks(storedTasks)
      } catch (err) {
        console.log(err)
        setError("Failed to load tasks.")
      } finally {
        setLoading(false)
      }
    }
    loadStoredTasks()
  }, []) // empty array = run once, after the first render only


  const handleAddTask = async (event) => {
    event.preventDefault()
    try {
      // POST operation on the backend:
      // returns TaskPublic with an id and 'completed' is false by default
      const task = await createTask(titleQuery, descriptionQuery, duedateQuery, priorityQuery, false)
      // Didnt delete the task's id as .map() uses task.id as the 'key' prop on each TaskCard
      // Correct way to append: Spreads previous items and appends new task
      // Updating setTasks rerenders the entire Home component
      setTasks(prevItems => [...prevItems, task])
      closeModal()
    } catch (err) {
      console.log(err)
      setError("Failed to create task.")
    }
  }
 
  const handleUpdateCompleted = async (task_id, is_completed) => {
    try {
      await updateCompleted(task_id, is_completed)

      // Update React state so the UI instantly updates when setTasks is called
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === task_id ? { ...task, completed: is_completed } : task
        )
      )
    } catch (err) {
      console.log(err)
      setError("Failed to update task completed field.")
    }
  }
 
  const handleDeleteTask = (task_id) => {
    setTasks(prevTasks => prevTasks.filter(t => t.id !== task_id))
  }
 

  // Opens the edit modal
  const handleOpenEditModal = (task) => {
    setIsEditModalOpen(true)
    setEditingTaskId(task.id)
    setTitleQuery(task.title)
    setDescriptionQuery(task.description)
    setDueDateQuery(task.due_date)
    setPriorityQuery(task.priority)
  }


  // When the edit form is submitted
  const handleEditTask = async (event) => {
    event.preventDefault()
    try {
      // use the id stored in the state editingTaskId
      const task = await updateTask(editingTaskId, titleQuery, descriptionQuery, duedateQuery, priorityQuery)
      setTasks(prevTasks => prevTasks.map(t => t.id === editingTaskId ? task : t))
      closeModal()
    } catch (err) {
      console.log(err)
      setError("Failed to update task")
    }
  }


  const handleSearch = (event) => {
    event.preventDefault()
  }
 
  const errorHandling = (err) => {
    setError(`Error: ${err}`)
  }
 
  const closeModal = () => {
    // set fields to blank
    setIsModalOpen(false)
    setIsEditModalOpen(false)
    setTitleQuery("")
    setDescriptionQuery("")
    setDueDateQuery("")
    setPriorityQuery("medium")
  }
  
  const getAdjustedDate = (dateString) => {
    if (dateString) {
      const dueDateParts = dateString.split('-')
      const year = Number(dueDateParts[0]);     // Returns the 4-digit year (e.g., 2026)
      const month = Number(dueDateParts[1]) - 1;   // Returns 0-11 (getMonth() is 0-indexed, Jan is 0)
      const day = Number(dueDateParts[2]);
      return new Date(year, month, day)
    }
    return Infinity
    
  }

  // Sort to-do tasks by priority and due-date
  const priorityOrder = {'high': 0, 'medium': 1, 'low': 2}
  const todoTasks = [...tasks.filter((t) => !t.completed)]
    .sort((a, b) => {
      return a.priority !== b.priority ? priorityOrder[a.priority] - priorityOrder[b.priority] 
      : getAdjustedDate(a.due_date) - getAdjustedDate(b.due_date)
    })
  
  // Log out functionality
  const { logout } = useContext(AuthContext)
  const handleLogout = () => {
    logout()
  }

  return (
    <div className="home">
 
      {/* ── Header ── */}
      <header className="home-header">
        <h1 className="app-title">Study Planner</h1>
        <div className="home-header-subtitle">Organize your tasks and stay on top of your studies!</div>
        <div className="home-header-right">
          <button className="btn-add-task" onClick={() => setIsModalOpen(true)}>
            + Add Task
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      {/* ── Search ── */}
      <div className="search-wrapper">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search tasks..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>
 
      {/* ── Error ── */}
      {error && <div className="error-message">{error}</div>}
 
      {/* ── Tasks Grid ── */}

      {/* 'key' is set to an id as an unique identifier for React to update a TaskCard easily */}
      {loading ? (
        <div className="loading">Loading tasks...</div>
      ) : (
        <div className="tasks-grid">

          {/* ── To-do Section ── */}
          <div className="tasks-section">
            <h3 className="non-completed">To-do:</h3>
            <div className="tasks-list">
              {/* Filter tasks based on search query and map to TaskCard components */}
              {todoTasks.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((task) => {
                // Overdue check
                let isOverdue = false
                if (task.due_date) {
                  isOverdue = (getAdjustedDate(task.due_date) < new Date())
                }

                return <TaskCard
                  task={task}
                  onDelete={handleDeleteTask}
                  onError={errorHandling}
                  onCompleted={handleUpdateCompleted}
                  isOverdue={isOverdue}
                  onEdit={handleOpenEditModal}
                  key={task.id}
                />
                })
              }
            </div>
          </div>
          <br></br>
          {/* ── Completed Section ── */}
          <div className="tasks-section">
            <h3 className="completed">Completed:</h3>
            <div className="tasks-list">
              {/* Filter tasks based on search query and map to TaskCard components */}
              {tasks.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .filter((t) => t.completed)
              .map((task) => (
                <TaskCard
                  task={task}
                  onDelete={handleDeleteTask}
                  onError={errorHandling}
                  onCompleted={handleUpdateCompleted}
                  isOverdue={false}
                  onEdit={handleOpenEditModal}
                  key={task.id}
                />
              ))
              }
            </div>
          </div>

        </div>
      )}
 
      {/* ── Add Task Modal ── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
 
            <div className="modal-header">
              <h2>New Task</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
 
            <form onSubmit={handleAddTask} className="modal-form">
 
              <div className="form-group">
                <label htmlFor="task-title">Title</label>
                <input
                  id="task-title"
                  type="text"
                  placeholder="e.g. Assignment 2"
                  value={titleQuery}
                  // Updates the state from an input element
                  onChange={(e) => setTitleQuery(e.target.value)}
                  required
                />
              </div>
 
              <div className="form-group">
                <label htmlFor="task-description">Description</label>
                <input
                  id="task-description"
                  type="text"
                  placeholder="e.g. CSC148 — binary trees"
                  value={descriptionQuery}
                  onChange={(e) => setDescriptionQuery(e.target.value)}
                />
              </div>
 
              <div className="form-group">
                <label htmlFor="task-duedate">Due Date</label>
                <input
                  id="task-duedate"
                  type="date"
                  value={duedateQuery}
                  onChange={(e) => setDueDateQuery(e.target.value)}
                />
              </div>
 
              <div className="form-group">
                <label htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  value={priorityQuery}
                  onChange={(e) => setPriorityQuery(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
 
              <button type="submit" className="btn-submit">Add Task</button>
 
            </form>
          </div>
        </div>
      )}


      {/* ── Edit Task Modal ── */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
 
            <div className="modal-header">
              <h2>Edit Task</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
 
            <form onSubmit={handleEditTask} className="modal-form">
 
              <div className="form-group">
                <label htmlFor="task-title">Title</label>
                <input
                  id="task-title"
                  type="text"
                  placeholder={titleQuery}
                  value={titleQuery}
                  // Updates the state from an input element
                  onChange={(e) => setTitleQuery(e.target.value)}
                  required
                />
              </div>
 
              <div className="form-group">
                <label htmlFor="task-description">Description</label>
                <input
                  id="task-description"
                  type="text"
                  placeholder={descriptionQuery}
                  value={descriptionQuery}
                  onChange={(e) => setDescriptionQuery(e.target.value)}
                />
              </div>
 
              <div className="form-group">
                <label htmlFor="task-duedate">Due Date</label>
                <input
                  id="task-duedate"
                  type="date"
                  placeholder={duedateQuery}
                  value={duedateQuery}
                  onChange={(e) => setDueDateQuery(e.target.value)}
                />
              </div>
 
              <div className="form-group">
                <label htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  placeholder={priorityQuery}
                  value={priorityQuery}
                  onChange={(e) => setPriorityQuery(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
 
              <button type="submit" className="btn-submit">Edit Task</button>
 
            </form>
          </div>
        </div>
      )}


    </div>
  )
}
 
export default Home
