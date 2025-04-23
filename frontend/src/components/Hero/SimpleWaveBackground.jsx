import React from "react";
import styled, { keyframes } from "styled-components";

// Create wave animation with CSS
const waveAnimation = keyframes`
  0% {
    transform: translateX(0) translateZ(0) scaleY(1);
  }
  50% {
    transform: translateX(-25%) translateZ(0) scaleY(0.8);
  }
  100% {
    transform: translateX(-50%) translateZ(0) scaleY(1);
  }
`;

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
  opacity: 0.7;
`;

const WaveWrapper = styled.div`
  position: absolute;
  width: 200%;
  height: 100%;
  bottom: -25%;
  background: linear-gradient(180deg, rgba(21, 101, 192, 0.1) 0%, rgba(100, 181, 246, 0.4) 100%);
  animation: ${waveAnimation} 25s infinite linear;
  border-radius: 50% 50% 0 0;
`;

const SecondWaveWrapper = styled(WaveWrapper)`
  opacity: 0.5;
  bottom: -35%;
  animation: ${waveAnimation} 17s infinite linear;
  background: linear-gradient(180deg, rgba(30, 136, 229, 0.2) 0%, rgba(66, 165, 245, 0.5) 100%);
`;

const ThirdWaveWrapper = styled(WaveWrapper)`
  opacity: 0.3;
  bottom: -45%;
  animation: ${waveAnimation} 32s infinite linear;
  background: linear-gradient(180deg, rgba(13, 71, 161, 0.1) 0%, rgba(30, 136, 229, 0.3) 100%);
`;

const SimpleWaveBackground = () => {
  return (
    <Container>
      <WaveWrapper />
      <SecondWaveWrapper />
      <ThirdWaveWrapper />
    </Container>
  );
};

export default SimpleWaveBackground; 