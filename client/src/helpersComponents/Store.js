import { createContext, useEffect, useMemo, useReducer } from 'react'

export const Store = createContext();

const readStoredJson = (key, fallback, isValid) => {
    try {
        const value = localStorage.getItem(key);
        if (!value) return fallback;
        const parsed = JSON.parse(value);
        if (!isValid(parsed)) throw new Error('Invalid stored value');
        return parsed;
    } catch {
        localStorage.removeItem(key);
        return fallback;
    }
};

const initialState = {
    userInfo: readStoredJson('userInfo', null, (value) => value === null || typeof value === 'object'),
    guestOrderAccess: readStoredJson('guestOrderAccess', {}, (value) => value !== null && !Array.isArray(value) && typeof value === 'object'),
    cart: {
        shippingInfo: readStoredJson('shippingInfo', {}, (value) => value !== null && !Array.isArray(value) && typeof value === 'object'),
        paymentMethod: localStorage.getItem('paymentMethod') || '',
        cartItems: readStoredJson('cartItems', [], Array.isArray)
    }
};

function reducer(state, action) {
    switch (action.type) {
        case 'CART_ADD_ITEM':
            //add to cart
            const newItem = action.payload;
            const exists = state.cart.cartItems.find((x) => x._id === newItem._id);

            const cartItems = exists ?
                state.cart.cartItems.map((x) => x._id === exists._id ?
                    newItem : x)
                : [...state.cart.cartItems, newItem];

            return { ...state, cart: { ...state.cart, cartItems } };

        case 'CART_REMOVE_ITEM': {
            const cartItems = state.cart.cartItems.filter((item) => item._id !== action.payload._id);

            return { ...state, cart: { ...state.cart, cartItems } };
        }
        case 'CART_CLEAR':
            return { ...state, cart: { ...state.cart, cartItems: [] } };
        case 'USER_LOGIN':
            return { ...state, userInfo: action.payload };
        case 'USER_REGISTER':
            return { ...state, userInfo: action.payload };
        case 'USER_LOGOUT':
            return { ...state, userInfo: null, cart: { cartItems: [], shippingInfo: {}, paymentMethod: '' } };
        case 'SAVE_GUEST_ORDER_ACCESS':
            return { ...state, guestOrderAccess: { ...state.guestOrderAccess, [action.payload.orderId]: action.payload.token } };
        case 'SAVE_SHIPPING_INFO':
            return {
                ...state, cart: { ...state.cart, shippingInfo: action.payload }
            };
        case 'SAVE_PAYMENT_METHOD':
            return {
                ...state, cart: { ...state.cart, paymentMethod: action.payload }
            };
        default:
            return state;
    }
}

function StoreProvider(props) {
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        const persist = (key, value, shouldRemove) => {
            if (shouldRemove) localStorage.removeItem(key);
            else localStorage.setItem(key, JSON.stringify(value));
        };

        persist('userInfo', state.userInfo, !state.userInfo);
        persist('guestOrderAccess', state.guestOrderAccess, Object.keys(state.guestOrderAccess).length === 0);
        persist('cartItems', state.cart.cartItems, state.cart.cartItems.length === 0);
        persist('shippingInfo', state.cart.shippingInfo, Object.keys(state.cart.shippingInfo).length === 0);
        if (state.cart.paymentMethod) localStorage.setItem('paymentMethod', state.cart.paymentMethod);
        else localStorage.removeItem('paymentMethod');
    }, [state]);

    const value = useMemo(() => ({ state, dispatch }), [state]);
    return <Store.Provider value={value}>{props.children} </Store.Provider>
}

export default StoreProvider;
