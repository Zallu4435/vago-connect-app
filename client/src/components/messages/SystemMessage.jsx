import React from 'react';

const SystemMessage = ({ message }) => {
    return (
        <div className="flex justify-center w-full my-2">
            <div className="bg-ancient-bg-medium/80 text-ancient-text-muted text-xs shadow-sm backdrop-blur-sm px-4 py-1.5 rounded-lg text-center max-w-[85%] border border-ancient-border-stone/30">
                {message.content}
            </div>
        </div>
    );
};

export default SystemMessage;
