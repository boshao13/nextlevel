import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    position: relative; /* Ensure relative positioning */
    background-color: white; /* Global white background */
  }

  * {
    box-sizing: border-box;
  }

  h1 {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
    visibility: hidden;
  }
`;

export default GlobalStyle;
