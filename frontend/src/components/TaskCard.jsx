import {deleteTask} from "../services/api"
import {useState} from 'react'
import "/Users/macblu/Downloads/VS Code Projects/Full-Stack Study Planner/frontend/src/TaskCard.css"

// @ts-check


// @ts-ignore

function TaskCard({ task, onDelete, onError, onCompleted }) { // task is an object/dict
  const [isChecked, setIsChecked] = useState(task.completed)
 
  const handleCheckboxChange = (event) => {
    // Change the 'completed' field in the frontend interface
    const newValue = event.target.checked
    setIsChecked(newValue)
    // Change the 'completed' attribute in the backend database
    onCompleted(task.id, newValue)
  }
 
  const handleDeleteTask = async (task_id) => {
    try {
      // delete the task from the backend database
      await deleteTask(task_id)
      // delete the task form the frontend interface
      onDelete(task_id)
    } catch (err) {
      console.log(err)
      onError(err)
    }
  }
 
  return (
    // Wrapper divs and specific class names are what the CSS targets for layout. The styling 
    // depends on this structure
    <div className={`task-card ${task.priority} ${isChecked ? "completed" : ""}`}>
 
      {/* ── Header: priority badge + delete ── */}
      <div className="task-card-header">
        <span className={`priority-badge ${task.priority}`}>
          {task.priority}
        </span>
        <button className="delete-btn" onClick={() => handleDeleteTask(task.id)}>
          ✕
        </button>
      </div>
 
      {/* ── Body: title, date, description (on hover) ── */}
      <div className="task-card-body">
        <h3 className="task-title">{task.title}</h3>
        <p className="task-date">📅 {task.due_date}</p>
        <p className="task-description">{task.description}</p>
      </div>
 
      {/* ── Footer: completed toggle ── */}
      <div className="task-card-footer">
        <label className="completed-label">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={handleCheckboxChange}
          />
          <span>{isChecked ? "Completed" : "Mark complete"}</span>
        </label>
      </div>
 
    </div>
  )
}
 
export default TaskCard
