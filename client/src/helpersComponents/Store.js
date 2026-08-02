import { createContext, useReducer } from 'react'

export const Store = createContext();

const initialState = {
    userInfo: localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null,
    currItem: localStorage.getItem('currItem') ? JSON.parse(localStorage.getItem('currItem')) : {},

    cart: {
        shippingInfo: localStorage.getItem('shippingInfo') ? JSON.parse(localStorage.getItem('shippingInfo')) : {},
        paymentMethod: localStorage.getItem('paymentMethod') || '',
        cartItems: localStorage.getItem('cartItems') ? JSON.parse(localStorage.getItem('cartItems')) : []
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

            localStorage.setItem('cartItems', JSON.stringify(cartItems));

            return { ...state, cart: { ...state.cart, cartItems } };

        case 'CART_REMOVE_ITEM': {
            const cartItems = state.cart.cartItems.filter((item) => item._id !== action.payload._id);

            localStorage.setItem('cartItems', JSON.stringify(cartItems));

            return { ...state, cart: { ...state.cart, cartItems } };
        };
        case 'CART_CLEAR':
            localStorage.removeItem('cartItems');
            return { ...state, cart: { ...state.cart, cartItems: [] } };
        case 'USER_LOGIN':
            return { ...state, userInfo: action.payload };
        case 'USER_REGISTER':
            return { ...state, userInfo: action.payload };
        case 'USER_LOGOUT':
            localStorage.removeItem('userInfo');
            localStorage.removeItem('cartItems');
            localStorage.removeItem('shippingInfo');
            localStorage.removeItem('paymentMethod');
            localStorage.removeItem('currItem');
            return { ...state, userInfo: null, currItem: {}, cart: { cartItems: [], shippingInfo: {}, paymentMethod: '' } };
        case 'SAVE_SHIPPING_INFO':
            return {
                ...state, cart: { ...state.cart, shippingInfo: action.payload }
            };
        case 'SAVE_PAYMENT_METHOD':
            return {
                ...state, cart: { ...state.cart, paymentMethod: action.payload }
            };
        case 'PRODUCT_CREATE':
            const newProduct = action.payload;
            return { ...state, currItem: { ...state.currItem, newProduct } };
        case 'UPDATE_ITEM_REQUEST':
            return { ...state, loadingUpdate: true, itemToEditDb: action.payload };
        case 'UPDATE_ITEM_SUCCESS':
            return { ...state, itemToEditDb: action.payload, loadingUpdate: false };

        case 'UPDATE_ITEM_FAIL':
            return { ...state, loadingUpdate: false };

        case 'FETCH_SUCCESS_DETAILS':
            const currItem = action.payload
            localStorage.setItem('currItem', JSON.stringify(currItem))
            return { ...state, currItem: action.payload, loading: false };

        default:
            return state;
    }
}

function StoreProvider(props) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const value = { state, dispatch };
    return <Store.Provider value={value}>{props.children} </Store.Provider>
}

export default StoreProvider;
