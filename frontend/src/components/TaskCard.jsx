import {deleteTask} from "../services/api"
import {useState} from 'react'
import "/Users/macblu/Downloads/VS Code Projects/Full-Stack Study Planner/frontend/src/TaskCard.css"

// @ts-check


// @ts-ignore

function TaskCard({ task, onDelete, onError, onCompleted, isOverdue }) { // task is an object/dict

  const handleCheckboxChange = (event) => {
    const newValue = event.target.checked
    // Change the 'completed' attribute in the backend database
    // And just tell the parent. The parent updates, which passes a new prop down.
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

    // Change the due date format to DD, MM, YYYY
    let newDate = "No Due Date"
    if (task.due_date) {
      const dueDateParts = task.due_date.split('-')
      const year = Number(dueDateParts[0]);     // Returns the 4-digit year (e.g., 2026)
      const month = Number(dueDateParts[1]) - 1;   // Returns 0-11 (getMonth() is 0-indexed, Jan is 0)
      const day = Number(dueDateParts[2]);
        
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };

      const formattedDate = new Date(year, month, day)
      newDate = formattedDate.toLocaleDateString('en-US', options)  
    }
  return (
    // Wrapper divs and specific class names are what the CSS targets for layout. The styling 
    // depends on this structure
    <div className={`task-card ${task.priority} ${task.completed ? "completed" : ""} ${isOverdue ? "overdue" : ""}`}>
 
      {/* ── Header: priority badge + delete ── */}
      <div className="task-card-header">
        <span className={`priority-badge ${task.priority}`}>
          {task.priority}
        </span>
        <div className="task-card-header-right">
          {isOverdue && <span className="overdue-badge">Overdue</span>}
          <button className="delete-btn" onClick={() => handleDeleteTask(task.id)}>
          ✕
        </button>
        </div>
      </div>
 
      {/* ── Body: title, date, description (on hover) ── */}
      <div className="task-card-body">
        <h3 className="task-title">{task.title}</h3>
        <p className="task-date">📅 {newDate}</p>
        <p className="task-description">{task.description}</p>
      </div>
 
      {/* ── Footer: completed toggle ── */}
      <div className="task-card-footer">
        <label className="completed-label">
          <input
            type="checkbox"
            checked={task.completed} // Read directly from prop
            onChange={handleCheckboxChange}
          />
          <span>{task.completed ? "Completed" : "Mark complete"}</span>
        </label>
      </div>
 
    </div>
  )
}
 
export default TaskCard
