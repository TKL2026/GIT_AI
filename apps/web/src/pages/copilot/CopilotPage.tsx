import type { ChatMessageDto } from '@copilote/shared';
import {
  Button,
  Chip,
  Group,
  Loader,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
  TypographyStylesProvider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconBrandWhatsapp,
  IconBulb,
  IconMessageChatbot,
  IconReportAnalytics,
  IconSend,
  IconShieldExclamation,
  IconSparkles,
  IconTrash,
  IconTruckDelivery,
} from '@tabler/icons-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import { RecommendationCard } from '../../components/RecommendationCard';
import { useCopilotChat, useDailyReport } from '../../hooks/useCopilot';
import { useProductsToPush } from '../../hooks/useCommercial';
import { useFraudAnomalies } from '../../hooks/useFraud';
import { useReplenishmentForecast } from '../../hooks/useForecast';
import { usePurchaseRecommendations } from '../../hooks/usePurchasing';
import { useStockAlerts } from '../../hooks/useStock';
import { useSendWhatsAppDailyReport } from '../../hooks/useWhatsApp';
import { ApiError } from '../../lib/apiClient';
import { formatCurrency } from '../../lib/format';
import { PurchaseOrderFormModal } from '../purchases/PurchaseOrderFormModal';

const SUGGESTIONS = [
  'Y a-t-il des ruptures de stock ?',
  'Résume mes finances du mois',
  'Quels sont mes produits les plus rentables ?',
  'Ai-je des commandes fournisseurs en attente ?',
];

export function CopilotPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [input, setInput] = useState('');
  const viewportRef = useRef<HTMLDivElement>(null);

  const chat = useCopilotChat();
  const dailyReport = useDailyReport();
  const sendWhatsAppReport = useSendWhatsAppDailyReport();
  const isBusy = chat.isPending || dailyReport.isPending || sendWhatsAppReport.isPending;

  const { data: alerts = [] } = useStockAlerts();
  const { data: anomalies = [] } = useFraudAnomalies();
  const { data: forecast = [] } = useReplenishmentForecast();
  const { data: purchaseRecommendations = [] } = usePurchaseRecommendations();
  const { data: productsToPush = [] } = useProductsToPush();

  const [orderModalOpened, { open: openOrderModal, close: closeOrderModal }] = useDisclosure(false);
  const [prefill, setPrefill] = useState<{ item: { productId: string; quantity: number; unitCost?: number }; supplierId?: string } | null>(null);

  const replenishmentRows = useMemo(() => {
    const recommendationByProduct = new Map(purchaseRecommendations.map((r) => [r.productId, r]));
    return forecast
      .filter((f) => (f.recommendedReorderQuantity ?? 0) > 0)
      .map((f) => ({ ...f, recommendation: recommendationByProduct.get(f.productId) }))
      .slice(0, 3);
  }, [forecast, purchaseRecommendations]);

  const stockCards = alerts.slice(0, 3);
  const anomalyCards = anomalies.slice(0, 3);
  const opportunityCards = productsToPush.slice(0, 3);
  const hasRecommendations =
    stockCards.length + anomalyCards.length + replenishmentRows.length + opportunityCards.length > 0;

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

  function handleSendWhatsAppReport() {
    if (isBusy) return;
    sendWhatsAppReport.mutate(undefined, {
      onSuccess: () => {
        notifications.show({ color: 'green', message: 'Rapport du jour envoyé sur WhatsApp.' });
      },
      onError: (err) => {
        notifications.show({
          color: 'red',
          message: err instanceof ApiError ? err.message : "Impossible d'envoyer le rapport sur WhatsApp.",
        });
      },
    });
  }

  function handlePrepareOrder(row: (typeof replenishmentRows)[number]) {
    if (!row.recommendation) return;
    setPrefill({
      item: {
        productId: row.productId,
        quantity: row.recommendation.recommendedQuantity,
        unitCost: row.recommendation.lastUnitCost ?? undefined,
      },
      supplierId: row.recommendation.recommendedSupplierId ?? undefined,
    });
    openOrderModal();
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
              variant="light"
              color="green"
              leftSection={<IconBrandWhatsapp size={16} />}
              onClick={handleSendWhatsAppReport}
              disabled={isBusy}
            >
              Envoyer par WhatsApp
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
        <ScrollArea h={messages.length === 0 ? undefined : 480} viewportRef={viewportRef}>
          <Stack gap="sm">
            {messages.length === 0 && (
              <Stack gap="lg" py="md">
                <Group gap="xs">
                  <IconSparkles size={22} color="var(--mantine-color-emerald-6)" />
                  <Title order={4}>
                    Bonjour {user?.firstName}, j'ai analysé votre activité.
                  </Title>
                </Group>

                {hasRecommendations ? (
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                    {stockCards.map((p) => (
                      <RecommendationCard
                        key={`alert-${p.id}`}
                        severity="critical"
                        icon={IconAlertTriangle}
                        label="Stock critique"
                        title={p.name}
                        description={`${p.stockQuantity} unité(s) restante(s) (seuil ${p.minStock}).`}
                        actions={[{ label: 'Voir le produit', onClick: () => navigate(`/products/${p.id}`) }]}
                      />
                    ))}

                    {anomalyCards.map((a) => (
                      <RecommendationCard
                        key={`anomaly-${a.type}-${a.productId}-${a.performedByUserId ?? 'anon'}`}
                        severity={a.severity === 'high' ? 'critical' : 'warning'}
                        icon={IconShieldExclamation}
                        label="Anomalie"
                        title={a.productName}
                        description={a.description}
                        actions={[{ label: 'Voir Finance', onClick: () => navigate('/finance') }]}
                      />
                    ))}

                    {replenishmentRows.map((row) => (
                      <RecommendationCard
                        key={`replenish-${row.productId}`}
                        severity={
                          row.daysUntilStockout !== null && row.daysUntilStockout < 7 ? 'critical' : 'warning'
                        }
                        icon={IconTruckDelivery}
                        label="Réapprovisionnement"
                        title={row.productName}
                        description={`Je recommande de commander ${row.recommendedReorderQuantity} unité(s)${
                          row.recommendation?.recommendedSupplierName
                            ? ` auprès de ${row.recommendation.recommendedSupplierName}`
                            : ''
                        }.`}
                        actions={[
                          { label: 'Voir le produit', onClick: () => navigate(`/products/${row.productId}`) },
                          { label: 'Préparer commande', onClick: () => handlePrepareOrder(row), variant: 'filled' },
                        ]}
                      />
                    ))}

                    {opportunityCards.map((p) => (
                      <RecommendationCard
                        key={`opportunity-${p.productId}`}
                        severity="info"
                        icon={IconBulb}
                        label="Opportunité"
                        title={p.productName}
                        description={`${p.description} Marge unitaire : ${formatCurrency(p.marginPerUnit)}.`}
                        actions={[{ label: 'Voir le produit', onClick: () => navigate(`/products/${p.productId}`) }]}
                      />
                    ))}
                  </SimpleGrid>
                ) : (
                  <Text size="sm" c="dimmed">
                    Rien à signaler pour l'instant — aucune alerte, anomalie ou opportunité détectée.
                  </Text>
                )}

                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    Ou posez directement votre question :
                  </Text>
                  <Group gap="xs">
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
              </Stack>
            )}

            {messages.map((message, index) => (
              <Paper
                key={index}
                withBorder={message.role === 'assistant'}
                p="sm"
                radius="md"
                bg={message.role === 'user' ? 'emerald.6' : undefined}
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

      <PurchaseOrderFormModal
        opened={orderModalOpened}
        onClose={() => {
          closeOrderModal();
          setPrefill(null);
        }}
        initialItem={prefill?.item}
        initialSupplierId={prefill?.supplierId}
      />
    </>
  );
}
