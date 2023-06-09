import React, { useRef, useState } from "react";
import { Inviter, Session, SessionState, UserAgent, UserAgentOptions } from "sip.js";
import "./App.css";

const sipAccount = {
  domain: "test-135-sip.ttrs.in.th",
  websocket: "wss://test-135-sip.ttrs.in.th:8089/ws",
  extension: "3568143622000",
  password: "test1234",
};
let userAgent: UserAgent, sessionCall: Session;
const iceServer = [
  {
    username: "dc2d2894d5a9023620c467b0e71cfa6a35457e6679785ed6ae9856fe5bdfa269",
    credential: "tE2DajzSJwnsSbc123",
    urls: "turn:global.turn.twilio.com:3478?transport=udp",
  },
  {
    username: "dc2d2894d5a9023620c467b0e71cfa6a35457e6679785ed6ae9856fe5bdfa269",
    credential: "tE2DajzSJwnsSbc123",
    urls: "turn:global.turn.twilio.com:3478?transport=tcp",
  },
  {
    username: "dc2d2894d5a9023620c467b0e71cfa6a35457e6679785ed6ae9856fe5bdfa269",
    credential: "tE2DajzSJwnsSbc123",
    urls: "turn:global.turn.twilio.com:443?transport=tcp",
  },
];

export default function App() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [callDestination, setCallDestination] = useState("14131");

  const HandleRegister = () => {
    const userAgentOptions: UserAgentOptions = {
      uri: UserAgent.makeURI("sip:" + sipAccount.extension + "@" + sipAccount.domain),
      authorizationPassword: sipAccount.password,
      authorizationUsername: sipAccount.extension,
      transportOptions: {
        server: sipAccount.websocket,
      },
      sessionDescriptionHandlerFactoryOptions: {
        iceGatheringTimeout: 3,
        peerConnectionConfiguration: {
          ice_servers: iceServer,
        },
      },
    };

    userAgent = new UserAgent(userAgentOptions);

    userAgent.start().then(() => {
      const target = UserAgent.makeURI("sip:" + callDestination + "@" + sipAccount.domain);
      if (!target) {
        throw new Error("Failed to create target URI.");
      }
      const inviter = new Inviter(userAgent, target, {
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: true },
        },
      });
      inviter.stateChange.addListener((newState) => {
        switch (newState) {
          case SessionState.Establishing:
            // Session is establishing
            break;
          case SessionState.Established:
            setupRemoteMedia(inviter);
            // Session has been established
            break;
          case SessionState.Terminated:
            // Session has terminated
            break;
          default:
            break;
        }
      });
      inviter
        .invite()
        .then(() => {
          // INVITE sent
        })
        .catch((error: Error) => {
          console.log(error);
        });
    });
  };
  const setupRemoteMedia = (session: Session) => {
    const remoteStream = new MediaStream();
    const localStream = new MediaStream();
    sessionCall = session;
    if (session.sessionDescriptionHandler !== undefined) {
      // @ts-ignore
      session.sessionDescriptionHandler.peerConnection.getSenders().forEach((sender: RTCRtpSender) => {
        if (sender.track) {
          localStream.addTrack(sender.track);
        }
      });
      // @ts-ignore
      session.sessionDescriptionHandler.peerConnection.getReceivers().forEach((receiver: RTCRtpReceiver) => {
        if (receiver.track) {
          remoteStream.addTrack(receiver.track);
        }
      });
    }
    if (localVideoRef.current !== null && remoteVideoRef.current !== null) {
      localVideoRef.current.srcObject = localStream;
      remoteVideoRef.current.srcObject = remoteStream;
    }
  };

  const HandleChangeDestination = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCallDestination(event.target.value);
  };
  const HandleHangUp = () => {
    if (sessionCall === undefined) return;
    userAgent.stop();
    sessionCall.bye();
    if (localVideoRef.current !== null && remoteVideoRef.current !== null) {
      localVideoRef.current.srcObject = null;
      remoteVideoRef.current.srcObject = null;
    }
  };

  return (
    <div className="main">
      <div className="sip-detail">
        <div className="library">SipJS</div>
        <div>{sipAccount.extension + "@" + sipAccount.domain}</div>
      </div>
      <div className="sip-call">
        <button className="register-btn" onClick={HandleRegister}>
          Register & Call
        </button>
        <input className="call-destination-number" type="text" onChange={HandleChangeDestination} placeholder={callDestination} />
        <button className="hangup-btn" onClick={HandleHangUp}>
          Hangup
        </button>
      </div>
      <div className="video-section">
        <div className="local-video">
          <label className="title-video">Local</label>
          <video controls={false} ref={localVideoRef} autoPlay playsInline muted />
        </div>
        <div className="remote-video">
          <label className="title-video">Remote</label>
          <video controls={false} ref={remoteVideoRef} autoPlay playsInline />
        </div>
      </div>
    </div>
  );
}
