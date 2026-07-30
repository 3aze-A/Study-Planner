import TaskCard from "../components/TaskCard"
import {useState, useEffect, useContext} from "react"
import {getTasks, createTask, updateCompleted, updateTask} from "../services/api"
import "/Users/macblu/Downloads/VS Code Projects/Full-Stack Study Planner/frontend/src/Home.css"
import {AuthContext} from "../services/AuthContext"
import { motion, AnimatePresence } from "framer-motion"


// @ts-check

// @ts-ignore


// ═══════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.85, filter: "blur(4px)", transition: { duration: 0.2 } }
}

const modalBackdropVariants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: { opacity: 1, backdropFilter: "blur(8px)" },
  exit: { opacity: 0, backdropFilter: "blur(0px)" }
}

const modalWindowVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { type: "spring", damping: 25, stiffness: 300 } 
  },
  exit: { opacity: 0, scale: 0.92, y: 20, transition: { duration: 0.15 } }
}



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
 

  // Log out functionality
  const { logout } = useContext(AuthContext)
  const handleLogout = () => {
    logout()
  }


  useEffect(() => {
    const loadStoredTasks = async () => {
      try {
        const storedTasks = await getTasks()
        setTasks(storedTasks)
      } catch (err) {
        if (err.message === "Unauthorized. Please log in.") {
          logout() // Call the logout function from AuthContext to clear the token and redirect to login
          setError("Unauthorized. Please log in.")
        } else {
          setError(`Failed to load tasks: ${err.message}`)
        }
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
      if (err.message === "Unauthorized. Please log in.") {
        logout() // Call the logout function from AuthContext to clear the token and redirect to login
        setError("Unauthorized. Please log in.")
      } else {
        setError(`Failed to add task: ${err.message}`)
      }
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
      if (err.message === "Unauthorized. Please log in.") {
        logout() // Call the logout function from AuthContext to clear the token and redirect to login
        setError("Unauthorized. Please log in.")
      } else {
        setError(`Failed to update task complete field: ${err.message}`)
      }
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
      if (err.message === "Unauthorized. Please log in.") {
        logout() // Call the logout function from AuthContext to clear the token and redirect to login
        setError("Unauthorized. Please log in.")
      } else {
        setError(`Failed to update task: ${err.message}`)
      }
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
  
  

  return (
    <div className="home">
 
      {/* ── Header ── */}
      <header className="home-header">
        <h1 className="app-title">Study Planner</h1>
        <div className="home-header-subtitle">Organize your tasks and stay on top of your studies!</div>
        <div className="home-header-right">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-add-task" 
            onClick={() => setIsModalOpen(true)}
          >
            + Add Task
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn-logout" 
            onClick={handleLogout}
          >
            Log out
          </motion.button>
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
            <motion.div 
              className="tasks-list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="popLayout">
                {/* Filter tasks based on search query and map to TaskCard components */}
                {todoTasks.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((task) => {
                  // Overdue check
                  let isOverdue = false
                  if (task.due_date) {
                    isOverdue = (getAdjustedDate(task.due_date) < new Date())
                  }

                  return (
                    <motion.div
                      key={task.id}
                      layout
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    >
                      <TaskCard
                        task={task}
                        onDelete={handleDeleteTask}
                        onError={errorHandling}
                        onCompleted={handleUpdateCompleted}
                        isOverdue={isOverdue}
                        onEdit={handleOpenEditModal}
                      />
                    </motion.div>
                  )
                  })
                }
              </AnimatePresence>
            </motion.div>
          </div>
          <br></br>
          {/* ── Completed Section ── */}
          <div className="tasks-section">
            <h3 className="completed">Completed:</h3>
            <motion.div 
              className="tasks-list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="popLayout">
                {/* Filter tasks based on search query and map to TaskCard components */}
                {tasks.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .filter((t) => t.completed)
                .map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  >
                    <TaskCard
                      task={task}
                      onDelete={handleDeleteTask}
                      onError={errorHandling}
                      onCompleted={handleUpdateCompleted}
                      isOverdue={false}
                      onEdit={handleOpenEditModal}
                    />
                  </motion.div>
                ))
                }
              </AnimatePresence>
            </motion.div>
          </div>

        </div>
      )}
 
      {/* ── Modals with AnimatePresence ── */}
      <AnimatePresence>
        {/* ── Add Task Modal ── */}
        {isModalOpen && (
          <motion.div 
            className="modal-overlay" 
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeModal}
          >
            <motion.div 
              className="modal" 
              variants={modalWindowVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
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
   
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  className="btn-submit"
                >
                  Add Task
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* ── Edit Task Modal ── */}
        {isEditModalOpen && (
          <motion.div 
            className="modal-overlay" 
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeModal}
          >
            <motion.div 
              className="modal" 
              variants={modalWindowVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
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
   
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  className="btn-submit"
                >
                  Edit Task
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
 
export default Home
