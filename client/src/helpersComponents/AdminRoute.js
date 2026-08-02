import React, { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Store } from './Store';
import { getLoginUrl } from '../util';

function AdminRoute({ children }) {

    const { state } = useContext(Store);
    const { userInfo } = state;
    const location = useLocation();

    if (!userInfo) {
        return <Navigate to={getLoginUrl(location.pathname, location.search)} replace />;
    }

    return userInfo.isAdmin ? children : <Navigate to="/" replace />;
}

export default AdminRoute;
