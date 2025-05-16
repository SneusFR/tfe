import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import FlowLogsPanel from '../components/FlowLogsPanel.jsx';
import { ToastProvider } from '../context/ToastContext';
import { FlowProvider } from '../context/FlowContext';
import { FlowManagerProvider } from '../context/FlowManagerContext';

// Mock the API responses
const server = setupServer(
  // GET logs endpoint
  http.get('/api/executions/logs', ({ request }) => {
    const url = new URL(request.url);
    const flowId = url.searchParams.get('flowId');
    const level = url.searchParams.get('level');
    
    // Return filtered data based on query params
    let data = mockLogs;
    
    if (level) {
      data = data.filter(log => log.level === level);
    }
    
    return HttpResponse.json({
      page: 1,
      limit: 20,
      total: data.length,
      data
    });
  }),
  
  // DELETE logs endpoint
  http.delete('/api/executions/logs', () => {
    return new HttpResponse(null, { status: 200 });
  })
);

// Sample mock data
const mockLogs = [
  {
    id: '1',
    timestamp: '2024-05-16T10:00:00.000Z',
    level: 'info',
    nodeId: 'node-1',
    nodeType: 'apiNode',
    message: 'API call successful',
    payload: JSON.stringify({ status: 'success', data: { id: 123 } })
  },
  {
    id: '2',
    timestamp: '2024-05-16T10:01:00.000Z',
    level: 'error',
    nodeId: 'node-2',
    nodeType: 'apiNode',
    message: 'API call failed',
    payload: JSON.stringify({ error: 'Not found', code: 404 })
  },
  {
    id: '3',
    timestamp: '2024-05-16T10:02:00.000Z',
    level: 'debug',
    nodeId: 'node-3',
    nodeType: 'textNode',
    message: 'Processing text',
    payload: JSON.stringify({ text: 'Sample text' })
  }
];

// Mock the useFlowAccess hook
jest.mock('../hooks/useFlowAccess.js', () => ({
  useFlowAccess: (role) => ({ hasAccess: role === 'owner' })
}));

// Setup and teardown the mock server
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Wrapper component for providing context
const TestWrapper = ({ children }) => (
  <MemoryRouter>
    <ToastProvider>
      <FlowManagerProvider>
        <FlowProvider nodes={[]} edges={[]} flowId="flow-123">
          {children}
        </FlowProvider>
      </FlowManagerProvider>
    </ToastProvider>
  </MemoryRouter>
);

describe('FlowLogsPanel', () => {
  test('renders logs table with data', async () => {
    render(
      <TestWrapper>
        <FlowLogsPanel flowId="flow-123" />
      </TestWrapper>
    );
    
    // Check for loading state first
    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('API call successful')).toBeInTheDocument();
    });
    
    // Check that all logs are displayed
    expect(screen.getByText('API call successful')).toBeInTheDocument();
    expect(screen.getByText('API call failed')).toBeInTheDocument();
    expect(screen.getByText('Processing text')).toBeInTheDocument();
  });
  
  test('filters logs by level', async () => {
    render(
      <TestWrapper>
        <FlowLogsPanel flowId="flow-123" />
      </TestWrapper>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('API call successful')).toBeInTheDocument();
    });
    
    // Select error level filter
    fireEvent.change(screen.getByLabelText(/niveau/i), { target: { value: 'error' } });
    
    // Click apply button
    fireEvent.click(screen.getByText('Appliquer'));
    
    // Check that only error logs are displayed
    await waitFor(() => {
      expect(screen.queryByText('API call successful')).not.toBeInTheDocument();
      expect(screen.getByText('API call failed')).toBeInTheDocument();
      expect(screen.queryByText('Processing text')).not.toBeInTheDocument();
    });
  });
  
  test('shows empty state when no logs', async () => {
    // Override the server handler to return empty data
    server.use(
      http.get('/api/executions/logs', () => {
        return HttpResponse.json({
          page: 1,
          limit: 20,
          total: 0,
          data: []
        });
      })
    );
    
    render(
      <TestWrapper>
        <FlowLogsPanel flowId="flow-123" />
      </TestWrapper>
    );
    
    // Wait for empty state to appear
    await waitFor(() => {
      expect(screen.getByText('Aucun log pour l\'instant')).toBeInTheDocument();
    });
  });
  
  test('deletes logs when owner', async () => {
    render(
      <TestWrapper>
        <FlowLogsPanel flowId="flow-123" />
      </TestWrapper>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('API call successful')).toBeInTheDocument();
    });
    
    // Click delete button
    fireEvent.click(screen.getByText('Effacer les logs'));
    
    // Confirm deletion
    fireEvent.click(screen.getByText('Supprimer'));
    
    // Check that logs are reloaded
    await waitFor(() => {
      expect(screen.getByText('API call successful')).toBeInTheDocument();
    });
  });
});
