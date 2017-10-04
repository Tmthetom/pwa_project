using System;

namespace Server.Logs
{
    class Logger
    {
        public void Write(string message)
        {
            Console.Write("[" + DateTime.Now + "] " + message);
        }

        public void WriteLine(string message)
        {
            Console.Write("[" + DateTime.Now + "] " + message + Environment.NewLine);
        }

        public void WriteLine(string message, ConsoleColor textColor)
        {
            Console.ForegroundColor = textColor;
            WriteLine(message);
            Console.ResetColor();
        }

        public void IntoFile(string message)
        {
            ;
        }
    }
}
