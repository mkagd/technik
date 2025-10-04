// components/CommentsSection.js
// System komentarzy i historii zmian dla rezerwacji/zamówień

import { useState, useEffect } from 'react';
import { 
  FiMessageSquare, FiSend, FiClock, FiUser, FiEdit2, FiTrash2, 
  FiActivity, FiCheckCircle, FiAlertCircle 
} from 'react-icons/fi';
import { useToast } from '../contexts/ToastContext';

export default function CommentsSection({ entityType, entityId }) {
  const toast = useToast();
  const [comments, setComments] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' or 'history'

  useEffect(() => {
    if (entityId) {
      loadData();
    }
  }, [entityId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Pobierz komentarze
      const commentsRes = await fetch(`/api/comments?type=${entityType}&id=${entityId}`);
      if (commentsRes.ok) {
        const data = await commentsRes.json();
        setComments(data.comments || []);
      }

      // Pobierz historię zmian
      const historyRes = await fetch(`/api/activity-log?type=${entityType}&id=${entityId}`);
      if (historyRes.ok) {
        const data = await historyRes.json();
        setActivityLog(data.activities || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSending(true);
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: entityType,
          entityId: entityId,
          comment: newComment.trim(),
          author: 'Administrator' // TODO: Get from auth context
        })
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
        toast.success('Komentarz został dodany');
      } else {
        toast.error('Błąd podczas dodawania komentarza');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Błąd połączenia z serwerem');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten komentarz?')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        toast.success('Komentarz został usunięty');
      } else {
        toast.error('Błąd podczas usuwania komentarza');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Błąd połączenia z serwerem');
    }
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'created':
        return <FiCheckCircle className="h-4 w-4 text-green-500" />;
      case 'updated':
      case 'status_changed':
        return <FiEdit2 className="h-4 w-4 text-blue-500" />;
      case 'deleted':
        return <FiTrash2 className="h-4 w-4 text-red-500" />;
      default:
        return <FiActivity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityDescription = (activity) => {
    switch (activity.action) {
      case 'created':
        return 'utworzył(a) rezerwację';
      case 'status_changed':
        return `zmienił(a) status z "${activity.oldValue}" na "${activity.newValue}"`;
      case 'updated':
        return `zaktualizował(a) ${activity.field || 'dane'}`;
      case 'comment_added':
        return 'dodał(a) komentarz';
      default:
        return activity.description || 'wykonał(a) akcję';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-3 sm:py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'comments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FiMessageSquare className="h-4 w-4" />
              <span>Komentarze</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {comments.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 sm:py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FiActivity className="h-4 w-4" />
              <span className="hidden sm:inline">Historia zmian</span>
              <span className="sm:hidden">Historia</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {activityLog.length}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">Ładowanie...</p>
          </div>
        ) : activeTab === 'comments' ? (
          <>
            {/* Add Comment */}
            <div className="mb-6">
              <div className="flex space-x-2 sm:space-x-3">
                <div className="flex-shrink-0 hidden sm:block">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiUser className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        handleAddComment();
                      }
                    }}
                    placeholder="Dodaj komentarz..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    rows="3"
                  />
                  <div className="mt-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-xs text-gray-500 hidden sm:block">
                      Tip: Użyj Ctrl+Enter aby szybko wysłać
                    </span>
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || sending}
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
                    >
                      {sending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Wysyłam...
                        </>
                      ) : (
                        <>
                          <FiSend className="h-4 w-4 mr-2" />
                          Dodaj komentarz
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiMessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Brak komentarzy</p>
                  <p className="text-xs mt-1">Dodaj pierwszy komentarz powyżej</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-2 sm:space-x-3 group">
                    <div className="flex-shrink-0 hidden sm:block">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <FiUser className="h-4 w-4 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {comment.author || 'Administrator'}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <FiClock className="h-3 w-3 mr-1" />
                            {new Date(comment.createdAt).toLocaleString('pl-PL', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 transition-opacity"
                          title="Usuń komentarz"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.comment}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          // Activity Log
          <div className="space-y-4">
            {activityLog.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiActivity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Brak historii zmian</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                {activityLog.map((activity, index) => (
                  <div key={activity.id || index} className="relative flex space-x-4 pb-4">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex-shrink-0 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                      {getActivityIcon(activity.action)}
                    </div>
                    
                    {/* Activity content */}
                    <div className="flex-1 pt-0.5">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.user || 'System'}</span>
                          {' '}
                          <span className="text-gray-600">{getActivityDescription(activity)}</span>
                        </p>
                        {activity.details && (
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.details}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2 flex items-center">
                          <FiClock className="h-3 w-3 mr-1" />
                          {new Date(activity.timestamp).toLocaleString('pl-PL', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
