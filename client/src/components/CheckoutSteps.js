import React from 'react';
import { useTranslation } from 'react-i18next';

function CheckoutSteps({ step1, step2, step3, step4 }) {
    const { t } = useTranslation();
    const steps = [
        { label: 'Contact', active: step1 },
        { label: 'Delivery', active: step2 },
        { label: 'Payment', active: step3 },
        { label: 'Review', active: step4 },
    ];

    return (
        <ol className="checkout-steps" aria-label={t('Checkout progress')}>
            {steps.map((step, index) => (
                <li className={step.active ? 'active' : ''} key={step.label} aria-current={step.active && !steps[index + 1]?.active ? 'step' : undefined}>
                    <span>{step.active ? <i className="fas fa-check" aria-hidden="true"></i> : index + 1}</span>
                    <strong>{t(step.label)}</strong>
                </li>
            ))}
        </ol>
    );
}

export default CheckoutSteps;
