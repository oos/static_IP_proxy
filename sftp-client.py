#!/usr/bin/env python3
"""
SFTP Client for Static IP Proxy Server
This client allows you to perform SFTP operations through your static IP proxy
"""

import requests
import json
import os
from typing import Optional, List, Dict, Any

class StaticIPSFTPClient:
    """SFTP client that routes operations through static IP proxy server"""
    
    def __init__(self, proxy_url: str = "https://static-ip-proxy.onrender.com"):
        self.proxy_url = proxy_url
        self.connection_id = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'StaticIP-SFTP-Client/1.0'
        })
    
    def connect(self, host: str, username: str, password: str = None, 
                private_key: str = None, port: int = 22) -> bool:
        """
        Connect to SFTP server through static IP proxy
        
        Args:
            host: SFTP server hostname
            username: SFTP username
            password: SFTP password (optional if private_key provided)
            private_key: Private key content (optional if password provided)
            port: SFTP port (default: 22)
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            data = {
                'host': host,
                'username': username,
                'port': port
            }
            
            if password:
                data['password'] = password
            elif private_key:
                data['privateKey'] = private_key
            else:
                raise ValueError("Either password or private_key must be provided")
            
            response = self.session.post(f"{self.proxy_url}/sftp/connect", json=data)
            response.raise_for_status()
            
            result = response.json()
            if result.get('success'):
                self.connection_id = result['connectionId']
                print(f"✅ Connected to {host} through static IP proxy")
                print(f"   Connection ID: {self.connection_id}")
                return True
            else:
                print(f"❌ Connection failed: {result.get('message', 'Unknown error')}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Connection error: {e}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return False
    
    def list_files(self, remote_path: str = ".") -> Optional[List[Dict[str, Any]]]:
        """
        List files in remote directory
        
        Args:
            remote_path: Remote directory path (default: ".")
        
        Returns:
            List of file information dictionaries or None if failed
        """
        if not self.connection_id:
            print("❌ Not connected. Call connect() first.")
            return None
        
        try:
            params = {'path': remote_path}
            response = self.session.get(
                f"{self.proxy_url}/sftp/list/{self.connection_id}", 
                params=params
            )
            response.raise_for_status()
            
            result = response.json()
            if result.get('success'):
                files = result.get('files', [])
                print(f"📁 Listed {len(files)} items in {remote_path}")
                return files
            else:
                print(f"❌ List failed: {result.get('message', 'Unknown error')}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"❌ List error: {e}")
            return None
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return None
    
    def download_file(self, remote_path: str, local_path: str = None) -> bool:
        """
        Download file from SFTP server
        
        Args:
            remote_path: Remote file path
            local_path: Local file path (default: same as remote filename)
        
        Returns:
            bool: True if download successful, False otherwise
        """
        if not self.connection_id:
            print("❌ Not connected. Call connect() first.")
            return False
        
        try:
            if not local_path:
                local_path = os.path.basename(remote_path)
            
            params = {'path': remote_path}
            response = self.session.get(
                f"{self.proxy_url}/sftp/download/{self.connection_id}", 
                params=params,
                stream=True
            )
            response.raise_for_status()
            
            with open(local_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"✅ Downloaded {remote_path} to {local_path}")
            return True
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Download error: {e}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return False
    
    def upload_file(self, local_path: str, remote_path: str) -> bool:
        """
        Upload file to SFTP server
        
        Args:
            local_path: Local file path
            remote_path: Remote directory path
        
        Returns:
            bool: True if upload successful, False otherwise
        """
        if not self.connection_id:
            print("❌ Not connected. Call connect() first.")
            return False
        
        if not os.path.exists(local_path):
            print(f"❌ Local file not found: {local_path}")
            return False
        
        try:
            with open(local_path, 'rb') as f:
                files = {'file': (os.path.basename(local_path), f, 'application/octet-stream')}
                data = {'path': remote_path}
                
                response = self.session.post(
                    f"{self.proxy_url}/sftp/upload/{self.connection_id}",
                    files=files,
                    data=data
                )
                response.raise_for_status()
            
            result = response.json()
            if result.get('success'):
                print(f"✅ Uploaded {local_path} to {remote_path}")
                return True
            else:
                print(f"❌ Upload failed: {result.get('message', 'Unknown error')}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Upload error: {e}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return False
    
    def disconnect(self) -> bool:
        """
        Disconnect from SFTP server
        
        Returns:
            bool: True if disconnect successful, False otherwise
        """
        if not self.connection_id:
            print("⚠️  Not connected.")
            return True
        
        try:
            response = self.session.post(f"{self.proxy_url}/sftp/disconnect/{self.connection_id}")
            response.raise_for_status()
            
            result = response.json()
            if result.get('success'):
                print("✅ Disconnected from SFTP server")
                self.connection_id = None
                return True
            else:
                print(f"❌ Disconnect failed: {result.get('message', 'Unknown error')}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Disconnect error: {e}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return False
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()

# Example usage
if __name__ == "__main__":
    # Example usage
    sftp = StaticIPSFTPClient()
    
    # Connect to SFTP server
    if sftp.connect(
        host="your-sftp-server.com",
        username="your-username",
        password="your-password"
    ):
        # List files
        files = sftp.list_files("/")
        if files:
            for file in files:
                print(f"  {file['name']} ({file['type']})")
        
        # Download a file
        sftp.download_file("/remote/file.txt", "local_file.txt")
        
        # Upload a file
        sftp.upload_file("local_file.txt", "/remote/")
        
        # Disconnect
        sftp.disconnect()
