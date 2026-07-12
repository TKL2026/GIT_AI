import type { ChatMessageDto } from '@copilote/shared';
import {
  Button,
  Chip,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  TypographyStylesProvider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconMessageChatbot, IconReportAnalytics, IconSend, IconTrash } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { PageHeader } from '../../components/PageHeader';
import { useCopilotChat, useDailyReport } from '../../hooks/useCopilot';
import { ApiError } from '../../lib/apiClient';

const SUGGESTIONS = [
  'Y a-t-il des ruptures de stock ?',
  'Résume mes finances du mois',
  'Quels sont mes produits les plus rentables ?',
  'Ai-je des commandes fournisseurs en attente ?',
];

export function CopilotPage() {
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [input, setInput] = useState('');
  const viewportRef = useRef<HTMLDivElement>(null);

  const chat = useCopilotChat();
  const dailyReport = useDailyReport();
  const isBusy = chat.isPending || dailyReport.isPending;

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isBusy]);

  function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || isBusy) return;

    const nextMessages: ChatMessageDto[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');

    chat.mutate(nextMessages, {
      onSuccess: (data) => {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
      },
      onError: (err) => {
        notifications.show({
          color: 'red',
          message: err instanceof ApiError ? err.message : "Le copilote n'a pas pu répondre.",
        });
      },
    });
  }

  function handleDailyReport() {
    if (isBusy) return;
    setMessages((prev) => [...prev, { role: 'user', content: '📊 Générer le rapport du jour' }]);

    dailyReport.mutate(undefined, {
      onSuccess: (data) => {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.report }]);
      },
      onError: (err) => {
        notifications.show({
          color: 'red',
          message: err instanceof ApiError ? err.message : 'Impossible de générer le rapport.',
        });
      },
    });
  }

  return (
    <>
      <PageHeader
        title="Copilote IA"
        description="Posez vos questions sur votre activité, en langage naturel."
        action={
          <Group gap="xs">
            <Button
              variant="light"
              leftSection={<IconReportAnalytics size={16} />}
              onClick={handleDailyReport}
              disabled={isBusy}
            >
              Rapport du jour
            </Button>
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconTrash size={16} />}
              onClick={() => setMessages([])}
              disabled={isBusy || messages.length === 0}
            >
              Nouvelle conversation
            </Button>
          </Group>
        }
      />

      <Paper withBorder radius="md" p="md" mb="md">
        <ScrollArea h={480} viewportRef={viewportRef}>
          <Stack gap="sm">
            {messages.length === 0 && (
              <Stack align="center" justify="center" gap="md" py="xl">
                <IconMessageChatbot size={40} color="var(--mantine-color-dimmed)" />
                <Text c="dimmed" size="sm" ta="center">
                  Demandez au copilote un état des lieux, un risque à surveiller ou une analyse.
                </Text>
                <Group justify="center" gap="xs">
                  {SUGGESTIONS.map((suggestion) => (
                    <Chip
                      key={suggestion}
                      variant="light"
                      onClick={() => sendMessage(suggestion)}
                      style={{ cursor: 'pointer' }}
                    >
                      {suggestion}
                    </Chip>
                  ))}
                </Group>
              </Stack>
            )}

            {messages.map((message, index) => (
              <Paper
                key={index}
                withBorder={message.role === 'assistant'}
                p="sm"
                radius="md"
                bg={message.role === 'user' ? 'blue.6' : undefined}
                style={{
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                }}
              >
                {message.role === 'user' ? (
                  <Text size="sm" c="white" style={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Text>
                ) : (
                  <TypographyStylesProvider fz="sm">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </TypographyStylesProvider>
                )}
              </Paper>
            ))}

            {isBusy && (
              <Paper withBorder p="sm" radius="md" style={{ alignSelf: 'flex-start' }}>
                <Group gap="xs">
                  <Loader size="xs" />
                  <Text size="sm" c="dimmed">
                    Le copilote réfléchit…
                  </Text>
                </Group>
              </Paper>
            )}
          </Stack>
        </ScrollArea>
      </Paper>

      <Group align="flex-end" gap="xs">
        <Textarea
          placeholder="Posez votre question au copilote…"
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              sendMessage(input);
            }
          }}
          autosize
          minRows={1}
          maxRows={6}
          disabled={isBusy}
          style={{ flex: 1 }}
        />
        <Button leftSection={<IconSend size={16} />} onClick={() => sendMessage(input)} disabled={isBusy || !input.trim()}>
          Envoyer
        </Button>
      </Group>
    </>
  );
}
