import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Database, Download, Upload, Save, Trash2, RefreshCw, HardDrive, Clock } from "lucide-react";
import { downloadDatabase, uploadDatabase, clearAllData, createBackup, getBackups, restoreBackup } from "../lib/sql-api-functions";

interface DatabaseManagerProps {
  onClose?: () => void;
}

export function DatabaseManager({ onClose }: DatabaseManagerProps) {
  const [backups, setBackups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load backups on component mount
  useState(() => {
    loadBackups();
  });

  const loadBackups = async () => {
    try {
      const availableBackups = await getBackups();
      setBackups(availableBackups);
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  };

  const handleDownloadDatabase = async () => {
    setIsLoading(true);
    try {
      await downloadDatabase();
    } catch (error) {
      console.error('Error downloading database:', error);
      alert('Error downloading database. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadDatabase = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        await uploadDatabase(file);
        alert('Database uploaded successfully! The page will reload to apply changes.');
        window.location.reload();
      } catch (error) {
        console.error('Error uploading database:', error);
        alert('Error uploading database. Please check the file format.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const backupKey = await createBackup();
      await loadBackups();
      alert(`Backup created successfully: ${backupKey}`);
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Error creating backup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async (backupKey: string) => {
    if (confirm(`Are you sure you want to restore backup ${backupKey}? This will replace all current data.`)) {
      setIsLoading(true);
      try {
        await restoreBackup(backupKey);
        alert('Backup restored successfully! The page will reload to apply changes.');
        window.location.reload();
      } catch (error) {
        console.error('Error restoring backup:', error);
        alert('Error restoring backup. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClearAllData = async () => {
    if (confirm('Are you sure you want to clear ALL data? This action cannot be undone and will delete all chats, files, subjects, chapters, and quiz data.')) {
      setIsLoading(true);
      try {
        await clearAllData();
        alert('All data cleared successfully!');
        window.location.reload();
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Error clearing data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatBackupDate = (backupKey: string) => {
    try {
      const timestamp = backupKey.replace('backup_', '');
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return backupKey;
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Database className="w-6 h-6" />
          Database Management
        </h2>
        <p className="text-gray-400">
          Manage your application data with cross-browser persistence using SQL.js
        </p>
      </div>

      {/* Export/Import Section */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Export & Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleDownloadDatabase}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Database
            </Button>
            
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".db"
                onChange={handleUploadDatabase}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Database
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Download your database to back it up or transfer to another device. Upload a .db file to restore data.
          </p>
        </CardContent>
      </Card>

      {/* Backup Section */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Save className="w-5 h-5" />
            Local Backups
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleCreateBackup}
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Create Backup
          </Button>
          
          {backups.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Available Backups:</h4>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {backups.map((backup) => (
                  <div key={backup} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Clock className="w-4 h-4" />
                      {formatBackupDate(backup)}
                    </div>
                    <Button
                      onClick={() => handleRestoreBackup(backup)}
                      disabled={isLoading}
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <p className="text-xs text-gray-400">
            Backups are stored locally in your browser. Create regular backups to protect your data.
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="glass-card border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleClearAllData}
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Data
          </Button>
          <p className="text-xs text-red-400 mt-2">
            Warning: This will permanently delete all your data including chats, files, subjects, chapters, and quiz progress.
          </p>
        </CardContent>
      </Card>

      {/* Information Section */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <h4 className="text-white font-medium mb-2">Cross-Browser Data Persistence</h4>
          <div className="space-y-2 text-sm text-gray-400">
            <p>✓ Data is automatically saved to browser localStorage</p>
            <p>✓ Access your data from any browser on the same device</p>
            <p>✓ Export/import to sync across different devices</p>
            <p>✓ API-less architecture with local SQL database</p>
          </div>
        </CardContent>
      </Card>

      {onClose && (
        <div className="text-center">
          <Button onClick={onClose} variant="outline" className="text-white border-gray-600">
            Close
          </Button>
        </div>
      )}
    </div>
  );
}