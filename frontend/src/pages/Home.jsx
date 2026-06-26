import TaskCard from "../components/TaskCard"
import {useState} from "react"
// @ts-check

// @ts-ignore

function Home() {
     const [searchQuery, setSearchQuery] = useState("");
    const tasks = [
        {id: 1, title: "CS", due_date:"2020"},
        {id: 2, title: "MAT", due_date:"2020"},
        {id: 3, title: "STA", due_date:"2027"},
    ]

    const handleSearch = () => {

    }

    return <div className="home">
        <form onSubmit={handleSearch} className="search_form">
            <input
                type="text" 
                placeholder="Search for tasks..." 
                className="search-input"
                value={searchQuery}
                {/* Updates the state from an input element */}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-button">Search</button>
        </form>
        {/* 'key' is set to an id as an unique identifier for React to update a MovieCard easily */}
        <div className="tasks-grid">
            {tasks.map((task) => 
                (<TaskCard task={task} key={task.id} />))}
        </div>
    </div>
}


export default Home