// @ts-check


// @ts-ignore
function TaskCard({task}) { // task is an object/dict

    function onAddClick() {
        alert("clicked")
    }

    return <div className="task-card">
        <div className="task-poster">
            <div className="task-overlay">
                <h1>{task.title}</h1>
                <h2>{task.due_date}</h2>
            </div>
        </div>
        <div className="task-info">
            <h3>{task.priority}</h3>
            <p>{String(task.completed)}</p>
        </div>
    </div>
}

export default TaskCard