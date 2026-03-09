import { Box, Card, CardContent, Typography } from "@mui/material";

export default function QuestionBank() {

  const questions = [
    { question: "What is Node.js?", topic: "Backend" },
    { question: "Explain REST API.", topic: "Backend" }
  ];

  return (
    <Box>

      <Typography variant="h4" mb={3}>
        Course Question Bank
      </Typography>

      {questions.map((q, i) => (

        <Card key={i} sx={{ mb: 2 }}>

          <CardContent>

            <Typography variant="h6">
              {q.question}
            </Typography>

            <Typography>
              Topic: {q.topic}
            </Typography>

          </CardContent>

        </Card>

      ))}

    </Box>
  );
}