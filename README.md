# Glass Chat

A modern, multilingual chat application built with React, TypeScript, and OpenAI integration. Features a beautiful glass-morphic UI design with interactive animations and real-time chat capabilities.

## 🌟 Features

- **Beautiful Glass-morphic UI**: Modern, translucent interface design
- **Multilingual Support**: Includes translations for:
  - English (en)
  - German (de)
  - Spanish (es)
  - French (fr)
  - Japanese (ja)
  - Portuguese (pt)
  - Chinese (zh)
- **Interactive Animations**: Custom loading screens and intro animations
- **Real-time Chat Interface**: Smooth chat experience with OpenAI integration
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Dark/Light Mode**: Built-in theme toggle for user preference
- **Force Graph Visualization**: Interactive network visualization component

## 🛠️ Tech Stack

- **Frontend**:
  - React with TypeScript
  - Vite for build tooling
  - Tailwind CSS for styling
  - shadcn/ui components
  - i18next for internationalization

- **Backend**:
  - Node.js with TypeScript
  - OpenAI API integration
  - Custom storage solution
  - RESTful API routes

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/Protospi/Glass-Portfolio.git
   cd glass-chat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with:
   ```
   # Add your environment variables here
   OPENAI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
glass-chat/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   ├── pages/        # Page components
│   │   └── translations/ # i18n translation files
├── server/                # Backend Node.js server
│   ├── openai.ts         # OpenAI integration
│   ├── routes.ts         # API routes
│   └── storage.ts        # Data storage logic
└── shared/               # Shared TypeScript types
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check [issues page](https://github.com/Protospi/Glass-Portfolio/issues).

## 📝 License

This project is [MIT](LICENSE) licensed.
