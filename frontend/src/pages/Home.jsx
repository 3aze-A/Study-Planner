import TaskCard from "../components/TaskCard"
import {useState, useEffect} from "react"
import {getTasks} from "../services/api"
// @ts-check

// @ts-ignore

function Home() {
     const [searchQuery, setSearchQuery] = useState("");
     const [tasks, setTasks] = useState([])
     const [error, setError] = useState(null);
     const [loading, setLoading] = useState(true)
    // const tasks = [
    //     {id: 1, title: "CS", due_date:"2020", priority:"medium", completed:true},
    //     {id: 2, title: "MAT", due_date:"2020", priority:"medium", completed:true},
    //     {id: 3, title: "STA", due_date:"2027", priority:"medium", completed:true},
    // ]

    useEffect(() =>{
        const loadStoredTasks = async () => {
            try {
                const storedTasks = await getTasks()
                setTasks(storedTasks)
            } catch (err) {
                console.log(err)
                setError("Failed to load tasks...")
            }
            finally {
                setLoading(false)
            }
        }

        loadStoredTasks()
    }, [])
    
    
    
    const handleSearch = () => {

    }

    return <div className="home">
        <form action="/submit-data" method="POST">
            
            {/* First Input Field ('for' and 'id' must be same)*/}
            <div class="form-group">
                <label for="title">Title:</label>
                <input type="text" id="title" name="title" placeholder=""/>
            </div>

            <div class="form-group">
                <label for="duedate">Due-date:</label>
                <input type="text" id="duedate" name="due-date" placeholder="eg. 23 April, 2026"/>
            </div>

            <div class="form-group">
                <label for="priority">Priority:</label>
                <input type="text" id="priority" name="priority" placeholder="low / medium / high"/>
            </div>

            <div class="form-group">
                <label for="completed">Completed:</label>
                <input type="text" id="completed" name="completed" placeholder="true / false"/>
            </div>
            

            <button type="submit">Add Task</button>
        </form>
        
        <form onSubmit={handleSearch} className="search_form">
            <input
                type="text" 
                placeholder="Search for tasks..." 
                className="search-input"
                value={searchQuery}
                // Updates the state from an input element
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-button">Search</button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {/* 'key' is set to an id as an unique identifier for React to update a MovieCard easily */}
        {loading ? (
            <div className="loading">Loading Tasks...</div>
        ) : (
            <div className="tasks-grid">
            {tasks.map((task) => 
                (<TaskCard task={task} key={task.id} />))}
            </div>
        )}
        
    </div>
}


export default Home