'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Mail, 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  User,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContactMessage {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const { toast } = useToast();

  const fetchMessages = async (page: number = 1) => {
    try {
      const response = await fetch(`/api/admin/messages?page=${page}&limit=10`);
      const result = await response.json();
      
      if (result.success) {
        setMessages(result.data);
        setPagination(result.pagination);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch messages",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: number, isRead: boolean) => {
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId, is_read: isRead }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, is_read: isRead } : msg
          )
        );
        toast({
          title: "Success",
          description: `Message marked as ${isRead ? 'read' : 'unread'}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update message status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="h-8 w-8 text-pink-600" />
          <h1 className="text-3xl font-bold text-gray-800">Contact Messages</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-2 border-pink-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="h-8 w-8 text-pink-600" />
        <h1 className="text-3xl font-bold text-gray-800">Contact Messages</h1>
        <Badge variant="secondary" className="ml-auto">
          {pagination.total} total messages
        </Badge>
      </div>

      <div className="grid gap-4">
        {messages.length === 0 ? (
          <Card className="border-2 border-pink-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No messages yet</h3>
              <p className="text-gray-500 text-center">
                When customers send messages through the contact form, they will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <Card 
              key={message.id} 
              className={`border-2 transition-all cursor-pointer hover:shadow-lg ${
                message.is_read 
                  ? 'border-pink-200 bg-white' 
                  : 'border-pink-400 bg-pink-50'
              }`}
              onClick={() => setSelectedMessage(message)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg text-gray-800">
                        {message.subject}
                      </CardTitle>
                      {!message.is_read && (
                        <Badge className="bg-pink-500 text-white">New</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {message.first_name} {message.last_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {message.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(message.created_at)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(message.id, !message.is_read);
                    }}
                    className="text-pink-600 hover:text-pink-700"
                  >
                    {message.is_read ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 line-clamp-2">
                  {message.message}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMessages(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="border-pink-200 text-pink-600 hover:bg-pink-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMessages(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="border-pink-200 text-pink-600 hover:bg-pink-50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto border-2 border-pink-200">
            <CardHeader className="border-b border-pink-200">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-gray-800 mb-2">
                    {selectedMessage.subject}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {selectedMessage.first_name} {selectedMessage.last_name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {selectedMessage.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(selectedMessage.created_at)}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Message:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                </div>
                <div className="flex gap-2 pt-4 border-t border-pink-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      markAsRead(selectedMessage.id, !selectedMessage.is_read);
                      setSelectedMessage(null);
                    }}
                    className="border-pink-200 text-pink-600 hover:bg-pink-50"
                  >
                    {selectedMessage.is_read ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Mark as Unread
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Mark as Read
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`);
                    }}
                    className="border-pink-200 text-pink-600 hover:bg-pink-50"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Reply via Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 