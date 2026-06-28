const BASE_URL = "http://localhost:8000/tasks"

export const getTasks = async () => {
    const response = await fetch(BASE_URL)
    // const data = await response.json()
    return response.json()
}
