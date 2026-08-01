import React from 'react';

function CheckoutSteps({ step1, step2, step3, step4 }) {
    const steps = [
        { label: 'Account', active: step1 },
        { label: 'Delivery', active: step2 },
        { label: 'Payment', active: step3 },
        { label: 'Review', active: step4 },
    ];

    return (
        <ol className="checkout-steps" aria-label="Checkout progress">
            {steps.map((step, index) => (
                <li className={step.active ? 'active' : ''} key={step.label} aria-current={step.active && !steps[index + 1]?.active ? 'step' : undefined}>
                    <span>{step.active ? <i className="fas fa-check" aria-hidden="true"></i> : index + 1}</span>
                    <strong>{step.label}</strong>
                </li>
            ))}
        </ol>
    );
}

export default CheckoutSteps;
