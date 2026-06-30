const BASE_URL = "http://localhost:8000/tasks"

export const getTasks = async () => {
    const response = await fetch(BASE_URL)
    // const data = await response.json()
    return response.json()
}

export const createTask = async (title, description, duedate, priority, completed) => {
    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: {
    "Content-Type": "application/json"
        },
        // field names must match exactly with the ones in database (case-sensitive)
        body : JSON.stringify({
            title: title,
            description: description,
            due_date: duedate,
            priority: priority,
            completed: Boolean(completed)
        })
    })
    return response.json()
}


export const deleteTask = async(task_id) => {
    const response = await fetch(`${BASE_URL}/${task_id}`, {
        method: "DELETE",
        headers: {
        "Content-Type": "application/json"
        }
    })
}

export const updateCompleted = async (task_id, is_completed) => {
    const response = await fetch(`${BASE_URL}/${task_id}`, {
        method: "PATCH",
        headers: {
        "Content-Type": "application/json"
        },
        body : JSON.stringify({
            completed: is_completed
        })
    })
}