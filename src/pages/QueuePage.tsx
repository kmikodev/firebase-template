/**
 * Queue Management Page - Admin view for managing queue
 */
import { useEffect, useState, useMemo } from 'react';
import { useQueue } from '@/contexts/QueueContext';
import { QueueTicketCard } from '@/components/queue/QueueTicketCard';
import { QueueListView } from '@/components/queue/QueueListView';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SearchBar } from '@/components/shared/SearchBar';
import { FilterBar, FilterConfig } from '@/components/shared/FilterBar';
import { Pagination } from '@/components/shared/Pagination';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { SortSelector, SortOption } from '@/components/shared/SortSelector';
import { ViewToggle, ViewMode } from '@/components/shared/ViewToggle';
import { ExportButton } from '@/components/shared/ExportButton';
import { Button } from '@/components/ui/Button';

const ITEMS_PER_PAGE = 9;

export default function QueuePage() {
  const {
    tickets,
    loading,
    listTickets,
    callTicket,
    markArrival,
    completeTicket,
    cancelTicket,
    advanceQueue,
  } = useQueue();

  const [searchQuery, setSearchQuery] = useState('');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState('position');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    listTickets();
  }, []);

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'waiting', label: 'Waiting' },
        { value: 'notified', label: 'Notified' },
        { value: 'arrived', label: 'Arrived' },
        { value: 'in_service', label: 'In Service' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'expired', label: 'Expired' },
      ],
    },
  ];

  const sortOptions: SortOption[] = [
    { value: 'position', label: 'Position' },
    { value: 'ticketNumber', label: 'Ticket Number' },
    { value: 'estimatedWaitTime', label: 'Wait Time' },
    { value: 'createdAt', label: 'Date Created' },
  ];

  const filteredTickets = useMemo(() => {
    let result = tickets || [];

    // Search filter
    if (searchQuery) {
      result = result.filter(t =>
        t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.userId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Active filters
    if (activeFilters.status) {
      result = result.filter(t => t.status === activeFilters.status);
    }

    // Sorting
    result.sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a];
      let bValue: any = b[sortBy as keyof typeof b];

      // Handle Firestore Timestamps
      if (sortBy === 'createdAt' && aValue?.toDate && bValue?.toDate) {
        aValue = aValue.toDate().getTime();
        bValue = bValue.toDate().getTime();
      }

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [tickets, searchQuery, activeFilters, sortBy, sortDirection]);

  // Pagination
  const totalPages = Math.ceil((filteredTickets?.length || 0) / ITEMS_PER_PAGE);
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredTickets?.slice(start, end);
  }, [filteredTickets, currentPage]);

  const handleCancel = async () => {
    if (!cancelId) return;
    await cancelTicket(cancelId, 'Cancelled by admin');
    setCancelId(null);
  };

  const handleFilterChange = (filters: Record<string, string>) => {
    setActiveFilters(filters);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleAdvanceQueue = async () => {
    // For demo, using first ticket's branch
    if (tickets.length > 0) {
      await advanceQueue(tickets[0].branchId);
      await listTickets();
    }
  };

  // Stats
  const stats = useMemo(() => {
    const waiting = tickets.filter(t => t.status === 'waiting').length;
    const notified = tickets.filter(t => t.status === 'notified').length;
    const arrived = tickets.filter(t => t.status === 'arrived').length;
    const inService = tickets.filter(t => t.status === 'in_service').length;

    return { waiting, notified, arrived, inService };
  }, [tickets]);

  if (loading && tickets.length === 0) {
    return <LoadingState message="Loading queue..." variant="skeleton" />;
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Queue Management' }]} />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Queue Management</h1>
          <p className="text-gray-600 mt-1">
            {filteredTickets?.length || 0} total {filteredTickets?.length === 1 ? 'ticket' : 'tickets'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={handleAdvanceQueue}>
            ⏭️ Advance Queue
          </Button>
          <ExportButton data={filteredTickets || []} filename="queue-tickets" />
          <ViewToggle view={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⏳</span>
            <div>
              <div className="text-sm text-gray-600">Waiting</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.waiting}</div>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔔</span>
            <div>
              <div className="text-sm text-gray-600">Notified</div>
              <div className="text-2xl font-bold text-blue-600">{stats.notified}</div>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <div>
              <div className="text-sm text-gray-600">Arrived</div>
              <div className="text-2xl font-bold text-green-600">{stats.arrived}</div>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✂️</span>
            <div>
              <div className="text-sm text-gray-600">In Service</div>
              <div className="text-2xl font-bold text-purple-600">{stats.inService}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by ticket number or user ID..."
        />
      </div>

      {/* Filter Bar and Sort */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <FilterBar
          filters={filterConfigs}
          onFilterChange={handleFilterChange}
          onReset={() => setSearchQuery('')}
        />
        <SortSelector
          options={sortOptions}
          value={sortBy}
          direction={sortDirection}
          onChange={setSortBy}
          onDirectionChange={setSortDirection}
        />
      </div>

      {/* Content */}
      {!paginatedTickets || paginatedTickets.length === 0 ? (
        <EmptyState
          icon="🎫"
          title="No tickets found"
          message={searchQuery || Object.keys(activeFilters).length > 0
            ? "No tickets match your search or filters. Try adjusting your criteria."
            : "No tickets in the queue yet."}
        />
      ) : (
        <>
          {/* Grid or List View */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {paginatedTickets.map((ticket) => (
                <QueueTicketCard
                  key={ticket.queueId}
                  ticket={ticket}
                  onCall={callTicket}
                  onMarkArrival={markArrival}
                  onComplete={completeTicket}
                  onCancel={setCancelId}
                />
              ))}
            </div>
          ) : (
            <div className="mb-6">
              <QueueListView
                tickets={paginatedTickets}
                onCall={callTicket}
                onMarkArrival={markArrival}
                onComplete={completeTicket}
                onCancel={setCancelId}
              />
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredTickets?.length || 0}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </>
      )}

      <ConfirmDialog
        open={!!cancelId}
        title="Cancel Ticket"
        message="Are you sure you want to cancel this ticket? This action cannot be undone."
        variant="danger"
        confirmLabel="Cancel Ticket"
        onConfirm={handleCancel}
        onClose={() => setCancelId(null)}
      />
    </div>
  );
}
