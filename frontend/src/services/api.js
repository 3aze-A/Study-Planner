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