import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import Confetti from 'react-confetti';

// Styled components for the game
const GameContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
  margin-top: 80px;
  align-items: center;

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const ScoreContainer = styled.div`
  background-color: #333;
  color: white;
  font-family: Arial, sans-serif;
  font-size: 1.2rem;
  padding: 10px;
  text-align: center;
  width: 200px;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  margin: 0 auto;
`;

const RetroText = styled.p`
  font-family: Arial, sans-serif;
  color: blue;
  font-size: 1.2rem;
  text-align: center;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  grid-template-rows: repeat(24, 1fr);
  gap: 1px;
  background-color: #222;
  border: 4px solid #ff0077;
  padding: 10px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  width: 400px;
  height: 400px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    width: 90vw;
    height: 90vw;
  }
`;

const SnakeBlock = styled.div`
  width: 100%;
  height: 100%;
  background-color: red;
`;

const FoodBlock = styled.div`
  width: 100%;
  height: 100%;
  background-color: yellow;
`;

const ControlsContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 10px;
`;

const ArrowPad = styled.div`
  display: grid;
  grid-template-columns: 60px 60px 60px;
  grid-template-rows: 60px 60px;
  gap: 10px;
  grid-template-areas:
    ". up ."
    "left down right";

  @media (max-width: 768px) {
    grid-template-columns: 50px 50px 50px;
    grid-template-rows: 50px 50px;
  }
`;

const ArrowButton = styled.button`
  background-color: #333;
  border: 2px solid #fff;
  color: white;
  font-size: 1.5rem;
  padding: 10px;
  border-radius: 5px;
  width: 60px;
  height: 60px;
  font-family: Arial, sans-serif;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  grid-area: ${({ area }) => area};

  &:active {
    background-color: #ff0077;
  }

  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
  }
`;

const Snake = () => {
  const [snake, setSnake] = useState([[10, 10]]);
  const [direction, setDirection] = useState([0, -1]);
  const [food, setFood] = useState(getRandomPosition);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // Check if mobile

  const gameLoop = useRef(null);

  const sendEmail = () => {
    const formData = {
      _subject: "Snake Game Winner",
      message: `Congratulations! You scored 2,500 points in the Snake game.`,
    };

    axios.post('https://formspree.io/f/xyzykjqq', formData)
      .then(() => alert('YOU WIN! You will be contacted for your $100 off.'))
      .catch((err) => console.error('Error sending email:', err));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isMobile) {
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
            if (direction[1] !== 1) setDirection([0, -1]);
            break;
          case 'ArrowDown':
          case 's':
            if (direction[1] !== -1) setDirection([0, 1]);
            break;
          case 'ArrowLeft':
          case 'a':
            if (direction[0] !== 1) setDirection([-1, 0]);
            break;
          case 'ArrowRight':
          case 'd':
            if (direction[0] !== -1) setDirection([1, 0]);
            break;
          default:
            break;
        }
      }
    };

    const handleResize = () => setIsMobile(window.innerWidth < 768);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [direction, isMobile]);

  useEffect(() => {
    gameLoop.current = setInterval(() => {
      moveSnake();
    }, 200);
    return () => clearInterval(gameLoop.current);
  }, [snake, direction]);

  const moveSnake = () => {
    const newSnake = [...snake];
    let newHead = [
      (newSnake[0][0] + direction[0] + 24) % 24,
      (newSnake[0][1] + direction[1] + 24) % 24,
    ];

    if (snake.some((segment) => segment[0] === newHead[0] && segment[1] === newHead[1])) {
      setIsGameOver(true);
      clearInterval(gameLoop.current);
      return;
    }

    newSnake.unshift(newHead);

    if (newHead[0] === food[0] && newHead[1] === food[1]) {
      setFood(getRandomPosition());
      setScore((prevScore) => {
        const newScore = prevScore + 100;
        if (newScore >= 2500) {
          setShowConfetti(true);
          sendEmail();
        }
        return newScore;
      });
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  };

  const resetGame = () => {
    setSnake([[10, 10]]);
    setDirection([0, -1]);
    setFood(getRandomPosition());
    setIsGameOver(false);
    setScore(0);
    setShowConfetti(false);
    gameLoop.current = setInterval(() => {
      moveSnake();
    }, 200);
  };

  const handleControlClick = (newDirection) => {
    setDirection(newDirection);
  };

  return (
    <GameContainer>
      {showConfetti && <Confetti />} {/* Show confetti when the score is reached */}
      {isGameOver ? (
        <div>
          <h1>Game Over</h1>
          <button onClick={resetGame}>Restart</button>
        </div>
      ) : (
        <>
          <ScoreContainer>Score: {score}</ScoreContainer>

          <Grid>
            {snake.map((segment, index) => (
              <SnakeBlock key={index} style={{ gridColumn: segment[0] + 1, gridRow: segment[1] + 1 }} />
            ))}
            <FoodBlock style={{ gridColumn: food[0] + 1, gridRow: food[1] + 1 }} />
          </Grid>

          <RetroText>{score >= 2500 ? 'YOU WIN!' : 'Reach 2,500 points for $100 off!'}</RetroText>

          <ControlsContainer>
            <ArrowPad>
              {isMobile ? (
                <>
                  <ArrowButton area="up" onClick={() => handleControlClick([0, -1])}>↑</ArrowButton>
                  <ArrowButton area="left" onClick={() => handleControlClick([-1, 0])}>←</ArrowButton>
                  <ArrowButton area="down" onClick={() => handleControlClick([0, 1])}>↓</ArrowButton>
                  <ArrowButton area="right" onClick={() => handleControlClick([1, 0])}>→</ArrowButton>
                </>
              ) : (
                <>
                  <ArrowButton area="up" onClick={() => handleControlClick([0, -1])}>W</ArrowButton>
                  <ArrowButton area="left" onClick={() => handleControlClick([-1, 0])}>A</ArrowButton>
                  <ArrowButton area="down" onClick={() => handleControlClick([0, 1])}>S</ArrowButton>
                  <ArrowButton area="right" onClick={() => handleControlClick([1, 0])}>D</ArrowButton>
                </>
              )}
            </ArrowPad>
          </ControlsContainer>
        </>
      )}
    </GameContainer>
  );
};

const getRandomPosition = () => {
  const x = Math.floor(Math.random() * 24);
  const y = Math.floor(Math.random() * 24);
  return [x, y];
};

export default Snake;
