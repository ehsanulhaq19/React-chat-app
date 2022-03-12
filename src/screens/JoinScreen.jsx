import React from 'react';
import JoinBlock from '../components/JoinBlock';

function JoinScreen({ onLogin }) {

  return (
    <div className="join-screen container">
        <div className="row">
            <div className="chat-info-container col-sm-0 col-md-6">
                <div className="chat-room-info">
                    <div className="heading">
                        <span>CHAT</span>
                        <span>ROOM</span>
                        <span>APP</span>
                    </div>
                    <br/>
                    <div className='detail'>
                        Join chat room of your choice
                    </div>
                </div>
            </div>
            <div className="join-form-container col-sm-12 col-md-6">
                <JoinBlock onLogin={onLogin} />
            </div>
        </div>
    </div>
  );
}

export default JoinScreen;
