import React, { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Store } from './Store';
import { getLoginUrl } from '../util';

function Protected({ children }) {

    const { state } = useContext(Store);
    const { userInfo } = state;
    const location = useLocation();

    return (
        userInfo ? children : (
            <Navigate
                to={getLoginUrl(location.pathname, location.search)}
                replace
            />
        )
    )
}

export default Protected;
