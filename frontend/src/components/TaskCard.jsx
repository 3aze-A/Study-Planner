import {deleteTask} from "../services/api"
import {useState} from 'react'


// @ts-check


// @ts-ignore
function TaskCard({task, onDelete, onError, onCompleted}) { // task is an object/dict
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
            let task = await deleteTask(task_id)
            // delete the task form the frontend interface
            onDelete(task_id)
        }
        catch (err) {
            console.log(err)
            onError(err)
        }   
    }

    return <div className="task-card">
        <div className="task-poster">
            <div className="task-overlay">
                <h1>{task.title}</h1>
                <h2>{task.due_date}</h2>
            </div>
        </div>
        <div className="task-info">
            <h3>Priority: {task.priority}</h3>
            <p>{task.description}</p>
        </div>

        <button className="deletetask-button" onClick={() => handleDeleteTask(task.id)}>
            Delete Task
        </button>

        <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>Completed: </span>
            <input 
                type="checkbox" 
                checked={isChecked} 
                onChange={handleCheckboxChange} 
            />
        </label>

    </div>
}

export default TaskCard