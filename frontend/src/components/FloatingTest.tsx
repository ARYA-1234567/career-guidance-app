import React from 'react';

const FloatingTest: React.FC = () => {
    return (
        <div style={{
            position: 'fixed',
            bottom: '100px',
            right: '20px',
            width: '200px',
            height: '100px',
            backgroundColor: 'red',
            color: 'white',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            borderRadius: '20px',
            border: '5px solid white',
            boxShadow: '0 0 50px rgba(255,0,0,0.5)'
        }}>
            DEPLOYMENT TEST: OK
        </div>
    );
};

export default FloatingTest;
