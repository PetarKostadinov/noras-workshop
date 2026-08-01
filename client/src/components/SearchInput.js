import React, { useState } from 'react'
import { Button, Form, FormControl, InputGroup } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom';

function Search() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const submitHandler = (e) => {
        e.preventDefault();
        navigate(query ? `/search/?query=${query}` : '/search');
    }
    return (
        <Form className="header-search" onSubmit={submitHandler}>
            <InputGroup className="header-search-group">
                <FormControl
                    type="text"
                    name="q" id="q"
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search gifts, décor and studio sets..."
                    aria-label="Search Products"
                    aria-describedby="button-search"
                >
                </FormControl>
                <Button type="submit" id="button-search" className="header-search-button">
                    <i className="fas fa-search"></i>
                </Button>
            </InputGroup>
        </Form>
    )
}

export default Search
