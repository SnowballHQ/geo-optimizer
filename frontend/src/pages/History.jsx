import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiService } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Trash2, Calendar, Globe, Tag } from 'lucide-react';

const History = () => {
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await apiService.getHistory();
      setHistory(response.data.history || []);
    } catch (error) {
      console.error('History fetch error:', error);
      // Error is already handled by API interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this analysis?")) {
      return;
    }

    setDeleteLoading(id);
    try {
      await apiService.deleteHistory(id);
      toast.success("Analysis deleted successfully!");
      setHistory(history.filter(item => item._id !== id));
      if (selected && selected._id === id) {
        setSelected(null);
      }
    } catch (error) {
      console.error('Delete history error:', error);
      // Error is already handled by API interceptor
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Analysis History</CardTitle>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {selected && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <CardTitle className="text-base">Analysis Details</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">URL</label>
                      <p className="text-sm text-muted-foreground break-all">{selected.url}</p>
                    </div>
                    
                    {selected.tags && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {selected.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Date</label>
                      <p className="text-sm text-muted-foreground">{formatDate(selected.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {history.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No Analysis History</h3>
                <p className="text-sm text-muted-foreground">Start your first analysis to see it here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <Card key={item._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Globe className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-foreground mb-1">
                              {item.url}
                            </h3>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(item.createdAt)}</span>
                              </span>
                              {item.tags && item.tags.length > 0 && (
                                <span className="flex items-center space-x-1">
                                  <Tag className="w-3 h-3" />
                                  <span>{item.tags.length} tags</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelected(item)}
                            className="text-xs"
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item._id)}
                            disabled={deleteLoading === item._id}
                            className="text-xs text-destructive hover:text-destructive"
                          >
                            {deleteLoading === item._id ? (
                              <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default History;