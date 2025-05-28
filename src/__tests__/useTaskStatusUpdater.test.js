import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import useTaskStatusUpdater from '../hooks/useTaskStatusUpdater';
import taskStore from '../store/taskStore';

// Mock du taskStore
vi.mock('../store/taskStore', () => ({
  default: {
    getAllTasks: vi.fn(),
    checkRunningTasksStatus: vi.fn()
  }
}));

describe('useTaskStatusUpdater', () => {
  let mockSetTasks;
  let mockTasks;
  const mockCurrentFlowId = 'test-flow-id';

  beforeEach(() => {
    mockSetTasks = vi.fn();
    mockTasks = [
      { id: '1', status: 'pending', description: 'Task 1' },
      { id: '2', status: 'running', description: 'Task 2' },
      { id: '3', status: 'completed', description: 'Task 3' }
    ];
    
    // Reset all mocks
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should refresh tasks when a running task completes', async () => {
    const updatedTasks = [
      { id: '1', status: 'pending', description: 'Task 1' },
      { id: '2', status: 'completed', description: 'Task 2' },
      { id: '3', status: 'completed', description: 'Task 3' }
    ];

    taskStore.getAllTasks.mockResolvedValue(updatedTasks);

    const { rerender } = renderHook(
      ({ runningTask }) => useTaskStatusUpdater(mockTasks, mockSetTasks, mockCurrentFlowId, runningTask),
      { initialProps: { runningTask: '2' } }
    );

    // Simulate task completion
    rerender({ runningTask: null });

    // Fast-forward time to trigger the timeout
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(taskStore.getAllTasks).toHaveBeenCalledWith(
      { forceRefresh: true },
      { id: mockCurrentFlowId }
    );
    expect(mockSetTasks).toHaveBeenCalledWith(updatedTasks);
  });

  it('should monitor running tasks and update when status changes', async () => {
    const statusCheckResult = {
      hasRunningTasks: false,
      statusChanged: true,
      tasks: [
        { id: '1', status: 'pending', description: 'Task 1' },
        { id: '2', status: 'completed', description: 'Task 2' },
        { id: '3', status: 'completed', description: 'Task 3' }
      ]
    };

    taskStore.checkRunningTasksStatus.mockResolvedValue(statusCheckResult);

    renderHook(() => useTaskStatusUpdater(mockTasks, mockSetTasks, mockCurrentFlowId, null));

    // Fast-forward time to trigger the interval
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(taskStore.checkRunningTasksStatus).toHaveBeenCalledWith({ id: mockCurrentFlowId });
    expect(mockSetTasks).toHaveBeenCalledWith(statusCheckResult.tasks);
  });

  it('should stop monitoring when no running tasks remain', async () => {
    const statusCheckResult = {
      hasRunningTasks: false,
      statusChanged: false,
      tasks: mockTasks
    };

    taskStore.checkRunningTasksStatus.mockResolvedValue(statusCheckResult);

    renderHook(() => useTaskStatusUpdater(mockTasks, mockSetTasks, mockCurrentFlowId, null));

    // Fast-forward time to trigger the interval
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(taskStore.checkRunningTasksStatus).toHaveBeenCalledWith({ id: mockCurrentFlowId });
    
    // The interval should stop after detecting no running tasks
    vi.clearAllMocks();
    
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // Should not be called again since monitoring stopped
    expect(taskStore.checkRunningTasksStatus).not.toHaveBeenCalled();
  });

  it('should not start monitoring if no running tasks exist', async () => {
    const tasksWithoutRunning = [
      { id: '1', status: 'pending', description: 'Task 1' },
      { id: '3', status: 'completed', description: 'Task 3' }
    ];

    renderHook(() => useTaskStatusUpdater(tasksWithoutRunning, mockSetTasks, mockCurrentFlowId, null));

    // Fast-forward time
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(taskStore.checkRunningTasksStatus).not.toHaveBeenCalled();
  });

  it('should provide forceRefresh function', async () => {
    const updatedTasks = [
      { id: '1', status: 'pending', description: 'Task 1 Updated' }
    ];

    taskStore.getAllTasks.mockResolvedValue(updatedTasks);

    const { result } = renderHook(() => 
      useTaskStatusUpdater(mockTasks, mockSetTasks, mockCurrentFlowId, null)
    );

    await act(async () => {
      await result.current.forceRefresh();
    });

    expect(taskStore.getAllTasks).toHaveBeenCalledWith(
      { forceRefresh: true },
      { id: mockCurrentFlowId }
    );
    expect(mockSetTasks).toHaveBeenCalledWith(updatedTasks);
  });

  it('should handle errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    taskStore.checkRunningTasksStatus.mockRejectedValue(new Error('API Error'));

    renderHook(() => useTaskStatusUpdater(mockTasks, mockSetTasks, mockCurrentFlowId, null));

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '❌ [TASK STATUS UPDATER] Error checking task status:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should cleanup timeouts on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { unmount } = renderHook(() => 
      useTaskStatusUpdater(mockTasks, mockSetTasks, mockCurrentFlowId, '2')
    );

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
