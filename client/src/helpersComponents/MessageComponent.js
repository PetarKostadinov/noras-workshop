import { Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

const messageMeta = {
    danger: { icon: 'fa-exclamation-circle', title: 'We couldn’t complete that' },
    warning: { icon: 'fa-exclamation-triangle', title: 'Please check this' },
    success: { icon: 'fa-check-circle', title: 'All set' },
    info: { icon: 'fa-info-circle', title: 'Good to know' },
};

function MessageComponent({ variant = 'info', title, children }) {
    const { t } = useTranslation();
    const meta = messageMeta[variant] || messageMeta.info;
    return (
        <Alert className="friendly-message" variant={variant} role={variant === 'danger' ? 'alert' : 'status'}>
            <i className={`fas ${meta.icon}`} aria-hidden="true"></i>
            <div>
                <strong>{title || t(meta.title)}</strong>
                <div>{children}</div>
            </div>
        </Alert>
    );
}

export default MessageComponent;
