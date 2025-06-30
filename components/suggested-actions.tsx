'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';
import { tool, UIMessage } from 'ai';

interface SuggestedAction {
  label: string;
  action: string;
}

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
  selectedVisibilityType: VisibilityType;
  messages: Array<UIMessage>;
}

function PureSuggestedActions({
  chatId,
  append,
  selectedVisibilityType,
  messages
}: SuggestedActionsProps) {

  // Use the most recent tool name for determining suggested actions
  const lastMessage = messages[messages.length - 1];
  const toolInvocationPart = lastMessage?.parts?.filter(x => x.type === 'tool-invocation')?.[0];
  const toolName = toolInvocationPart?.toolInvocation.toolName;
  const toolArgs = toolInvocationPart?.toolInvocation?.args?.filter;

  const moduleList = [
    { ToolName: 'getShipments', ModuleName: 'Shipment', Filter: 'ShipmentNo eq' },
    { ToolName: 'getBookings', ModuleName: 'Booking', Filter: 'BookingNo eq' },
    { ToolName: 'getBrokerages', ModuleName: 'Brokerage', Filter: 'BrokerageNo eq' },
    { ToolName: 'getContainers', ModuleName: 'Container', Filter: 'ContainerNo eq' },
    { ToolName: 'getDocuments', ModuleName: '', Filter: 'EntityRefCode eq' },
    { ToolName: 'getExceptions', ModuleName: '', Filter: '' },
    { ToolName: 'getTasks', ModuleName: '', Filter: '' },
    { ToolName: 'getComments', ModuleName: '', Filter: 'EntityRefCode eq' },
  ]

  const defaultActions = [
    {
      // title: 'Track your Order',
      label: 'Track your Order',
      action: 'Track your Order?',
    },
    {
      // title: 'Track your Booking',
      label: `Track your Booking`,
      action: `Track your Booking?`,
    },
    {
      // title: 'Track your Shipment',
      label: `Track your Shipment`,
      action: `Track your Shipment?`,
    },
    {
      // title: 'Track your Containers',
      label: 'Track your Container',
      action: 'Track your Container?',
    },
    {
      // title: "Invoices",
      label: "Get your Invoices",
      action: "Get your Invoices?"
    },
    {
      // title: "Invoices",
      label: "Booking Yet to Be Approved",
      action: "Booking Yet to Be Approved?"
    }
  ];

  const commonActions = [
    {
      label: "Show Documents",
      action: "Show Documents?",
    },
    {
      label: "Show Comments",
      action: "Show Comments?",
    },
    {
      label: "Show Activities",
      action: "Show Tasks?",
    },
    {
      label: "Show Exceptions",
      action: "Show Exceptions?",
    }
  ];

  // Module-specific actions
  const moduleSpecificActions: Record<string, SuggestedAction[]> = {
    shipment: [
      {
        label: "Show Complete Shipment Details",
        action: "Show Complete Shipment Details?",
      }
    ],
    order: [
      {
        label: "Show Order Status",
        action: "Show Order Status?",
      }
    ],
    container: [
      {
        label: "Show Container Tracking",
        action: "Show Container Tracking?",
      }
    ],
    booking: [
      {
        label: "Show Complete Booking Details",
        action: "Show Complete Booking Details?",
      }
    ]
  }

  let suggestedActions: SuggestedAction[] = defaultActions
  if (toolName) {
    const moduleObj = moduleList.find(module => module.ToolName == toolName);
    let moduleName = moduleObj?.ModuleName;

    if (!moduleName) {
      const assistantMessages = messages.filter(message => message.role === 'assistant');
      if (assistantMessages.length > 0) {
        assistantMessages.reverse();
        // Find the most recent assistant message with tool invocation
        for (const message of assistantMessages) {
          const toolInvocation = message.parts?.find(x => x.type === 'tool-invocation');
          if (toolInvocation) {
            const toolNameFromHistory = toolInvocation.toolInvocation.toolName;
            if (toolNameFromHistory && (toolNameFromHistory !== 'getDocuments' && toolNameFromHistory !== 'getExceptions' && toolNameFromHistory !== 'getTasks' && toolNameFromHistory !== 'getComments')) {
              switch (toolNameFromHistory) {
                case 'getShipments':
                  moduleName = 'Shipment';
                  break;
                case 'getBookings':
                  moduleName = 'Booking';
                  break;
                default:
                  break
              }
              break; // Exit the loop after finding and processing a valid tool name
            }
          }
        }
      }
    }

    const hasFilter = toolArgs && moduleObj?.Filter && toolArgs.includes(moduleObj.Filter);
    if (moduleName && hasFilter) {
      const moduleKey = moduleName.toLowerCase();
      const moduleActions = moduleSpecificActions[moduleKey] || [];
      suggestedActions = [...commonActions, ...moduleActions];
    }
  }

  return (
    <div
      data-testid="suggested-actions"
      className="flex flex-wrap gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.label}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();

              if (messages.length > 0) {
                window.history.replaceState({}, '', `/chat/${chatId}`);
              }

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-3xl px-3 py-1 text-xs flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            {/* <span className="font-medium">{suggestedAction.title}</span> */}
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;
    if (prevProps.messages.length !== nextProps.messages.length) return false;

    // Check if any message content has changed
    for (let i = 0; i < prevProps.messages.length; i++) {
      if (prevProps.messages[i] !== nextProps.messages[i]) return false;
    }

    return true;
  },
);
