import React, { useState } from "react";
import "./styles/SearchBar.scss";

const SearchBar = ({ onSearch }) => {
    const [query, setQuery] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(query.trim());
    };

    return (
        <div className="search-bar">
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="제목, 작성자, 날짜로 검색..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit">🔍</button>
            </form>
        </div>
    );
};

export default SearchBar;
