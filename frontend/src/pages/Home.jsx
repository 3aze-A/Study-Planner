import TaskCard from "../components/TaskCard"
import {useState, useEffect} from "react"
import {getTasks, createTask} from "../services/api"
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
    // Add Task Form Fields States:
     const [titleQuery, setTitleQuery] = useState("");
     const [descriptionQuery, setDescriptionQuery] = useState("");
     const [duedateQuery, setDueDateQuery] = useState("");
     const [priorityQuery, setPriorityQuery] = useState("");
     const [completedQuery, setCompletedQuery] = useState("");

     
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
    }, []) // empty array = run once, after the first render only
    
    
    const handleAddTask = async () => {
        try {
            const task = await createTask(titleQuery, descriptionQuery, duedateQuery, priorityQuery, 
            completedQuery === "" ? false : completedQuery)  // returns TaskPublic with an id

            // Correct way to append: Spreads previous items and appends new task
            setTasks(prevItems => [...prevItems, task]);
        } catch (err) {
            console.log(err)
            setError("Failed to create task...")
        }
        finally {
            // set fields to blank
        setTitleQuery("")
        setDescriptionQuery("")
        setDueDateQuery("")
        setPriorityQuery("")
        setCompletedQuery("")
        }
    }


    const handleSearch = () => {

    }

    return <div className="home">
        <form onSubmit={handleAddTask} className="search_form">
            <input
                type="text" 
                placeholder="eg. course name" 
                className="title-input"
                value={titleQuery}
                // Updates the state from an input element
                onChange={(e) => setTitleQuery(e.target.value)}
            />
            <input
                type="text" 
                className="description-input"
                value={descriptionQuery}
                onChange={(e) => setDescriptionQuery(e.target.value)}
            />
            <input
                type="text" 
                className="duedate-input"
                value={duedateQuery}
                onChange={(e) => setDueDateQuery(e.target.value)}
            />
            <input
                type="text"
                placeholder="low / medium / high?" 
                className="priority-input"
                value={priorityQuery}
                onChange={(e) => setPriorityQuery(e.target.value)}
            />
            <input
                type="text"
                placeholder="true / false? Default is false" 
                className="completed-input"
                value={completedQuery}
                onChange={(e) => setCompletedQuery(e.target.value)}
            />

            <button type="submit" className="addtask-button">Add Task</button>
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