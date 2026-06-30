import TaskCard from "../components/TaskCard"
import {useState, useEffect} from "react"
import {getTasks, createTask, updateCompleted} from "../services/api"
import "/Users/macblu/Downloads/VS Code Projects/Full-Stack Study Planner/frontend/src/Home.css"
// @ts-check

// @ts-ignore

function Home() {
  const [searchQuery, setSearchQuery]   = useState("")
  const [tasks, setTasks]               = useState([])
  const [error, setError]               = useState(null)
  const [loading, setLoading]           = useState(true)
  // Modal is the Add Task form
  const [isModalOpen, setIsModalOpen]   = useState(false)
 
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
      // returns TaskPublic with an id and 'completed' is false by default
      const task = await createTask(titleQuery, descriptionQuery, duedateQuery, priorityQuery, false)
      // Didnt delete the task's id as .map() uses task.id as the 'key' prop on each TaskCard
      // Correct way to append: Spreads previous items and appends new task
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
    } catch (err) {
      console.log(err)
      setError("Failed to update task.")
    }
  }
 
  const handleDeleteTask = (task_id) => {
    setTasks(prevTasks => prevTasks.filter(t => t.id !== task_id))
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
    setTitleQuery("")
    setDescriptionQuery("")
    setDueDateQuery("")
    setPriorityQuery("medium")
  }
 
  return (
    <div className="home">
 
      {/* ── Header ── */}
      <header className="home-header">
        <h1 className="app-title">Study Planner</h1>
        <button className="btn-add-task" onClick={() => setIsModalOpen(true)}>
          + Add Task
        </button>
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
          {tasks.map((task) => (
            // TaskCard is child component to which handleDeleteTask etc. are sent as a prop.
            <TaskCard
              task={task}
              onDelete={handleDeleteTask}
              onError={errorHandling}
              onCompleted={handleUpdateCompleted}
              key={task.id}
            />
          ))}
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
 
    </div>
  )
}
 
export default Home
