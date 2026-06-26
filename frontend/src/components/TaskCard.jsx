// @ts-check


// @ts-ignore
function TaskCard({task}) { // task is an object/dict

    function onAddClick() {
        alert("clicked")
    }

    return <div className="task-card">
        <div className="task-poster">
            <img src={task.url} alt={task.title}/>
            <div className="task-overlay">
                <button className="add-btn" onClick={onAddClick}>
                    Add Task
                </button>
            </div>
        </div>
        <div className="task-info">
            <h3>{task.title}</h3>
            <p>{task.due_date}</p>
        </div>
    </div>
}

export default TaskCard