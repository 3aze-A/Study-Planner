const BASE_URL = "http://localhost:8000"
const TASKS_URL = "http://localhost:8000/tasks"


const getAuthHead = () => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) return {}
    const user = JSON.parse(storedUser)
    return { Authorization: `Bearer ${user.token}` }
}


export const getTasks = async () => {
    const response = await fetch(TASKS_URL, {
        method: "GET",
        headers: {
            ...getAuthHead(),
            "Content-Type": "application/json"
        }
    })
    // if there is no token, ...getAuthHead() spreads an empty {} into nothing, and so
    // the request goes out without an Authorization header and hits the backend's 401 error.

    if (response.status === 401) {
        throw new Error("Unauthorized. Please log in.")
    }

    if (!response.ok) {
        throw new Error(`HTTP_ERROR_${response.status}`)
    }

    return await response.json()
}

export const createTask = async (title, description, duedate, priority, completed) => {
    try {
        const response = await fetch(TASKS_URL, {
            method: "POST",
            headers: {
        "Content-Type": "application/json",
        ...getAuthHead()
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

        if (response.status === 401) {
            throw new Error("Unauthorized. Please log in.")
        }

        return await response.json()
    } catch (err) {
        console.log(`Error occured in creating new task: ${err}`)
    }
}


export const deleteTask = async(task_id) => {
    const response = await fetch(`${TASKS_URL}/${task_id}`, {
        method: "DELETE",
        headers: {
        "Content-Type": "application/json",
        ...getAuthHead()
        }
    })

    if (response.status === 401) {
        throw new Error("Unauthorized. Please log in.")
    }

    return await response.json()
}

export const updateCompleted = async (task_id, is_completed) => {
    const response = await fetch(`${TASKS_URL}/${task_id}`, {
        method: "PATCH",
        headers: {
        "Content-Type": "application/json",
        ...getAuthHead()
        },
        body : JSON.stringify({
            completed: is_completed
        })
    })
    if (response.status === 401) {
        throw new Error("Unauthorized. Please log in.")
    }
}


export const updateTask = async (task_id, title, description, duedate, priority, completed) => {
    try {
        const response = await fetch(`${TASKS_URL}/${task_id}`, {
            method: "PATCH",
            headers: {
        "Content-Type": "application/json",
        ...getAuthHead()
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

        if (response.status === 401) {
            throw new Error("Unauthorized. Please log in.")
        }

        return await response.json()
    } catch (err) {
        console.log(`Error occured in updating the task: ${err}`)
    }
}


export const loginUser = async (email, password) => {
    const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
            headers: {
        "Content-Type": "application/json"
            },
            // field names must match exactly with the ones in database (case-sensitive)
            body : JSON.stringify({
                email: email,
                password: password,
            })
    })
    
    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Login failed')
    }

    return await response.json()
}

export const registerUser = async (email, password) => {
    const response = await fetch(`${BASE_URL}/register`, {
    method: "POST",
            headers: {
        "Content-Type": "application/json"
            },
            // field names must match exactly with the ones in database (case-sensitive)
            body : JSON.stringify({
                email: email,
                password: password,
            })
    })
    if (!response.ok) {
        // even if !response.ok, the response still has a body which is whatever the HTTPExtension is shaped
        // like in backend: 'HTTPException(status_code=409, detail="Email is already used. Please log-in.'
        // so the json is: { "detail": "Email is already used. Please log-in." }
        const errorData = await response.json()
        throw new Error(errorData.detail || "Registration failed.")
    }
    
    return await response.json()
}
