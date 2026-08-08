import React, { useState } from 'react'
import { Button, Form, FormControl, InputGroup } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Search() {
    const navigate = useNavigate();
    const { t } = useTranslation();
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
                    placeholder={t('Search gifts, décor and studio sets...')}
                    aria-label={t('Search products')}
                >
                </FormControl>
                <Button type="submit" id="button-search" className="header-search-button" aria-label={t('Search products')}>
                    <i className="fas fa-search" aria-hidden="true"></i>
                </Button>
            </InputGroup>
        </Form>
    )
}

export default Search
