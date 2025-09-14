"""
Linear data importer for syncing Linear workspace data.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from .base_importer import BaseImporter
from .linear_client import LinearClient
from .config import ImportConfig
from .exceptions import ImportError


class LinearImporter(BaseImporter):
    """Importer for Linear workspace data."""
    
    def __init__(self, config: ImportConfig):
        """Initialize the Linear importer.
        
        Args:
            config: Import configuration
        """
        super().__init__(config, 'linear')
        
        service_config = config.get_service_config('linear')
        self.client = LinearClient(
            api_key=service_config['api_key'],
            workspace_id=service_config.get('workspace_id'),
            timeout=service_config['timeout']
        )
        
        # Test connection on initialization
        if not self.client.test_connection():
            raise ImportError("Failed to connect to Linear API")
    
    def fetch_data(self, since: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Fetch data from Linear.
        
        Args:
            since: Only fetch data modified since this timestamp
            
        Returns:
            List of data items from Linear
        """
        all_data = []
        
        try:
            # Fetch issues
            self.logger.info("Fetching Linear issues...")
            issues = self.client.get_issues(since=since)
            for issue in issues:
                issue['data_type'] = 'issue'
            all_data.extend(issues)
            
            # Fetch projects
            self.logger.info("Fetching Linear projects...")
            projects = self.client.get_projects(since=since)
            for project in projects:
                project['data_type'] = 'project'
            all_data.extend(projects)
            
            # Fetch teams (only on full sync since they don't change often)
            if since is None:
                self.logger.info("Fetching Linear teams...")
                teams = self.client.get_teams()
                for team in teams:
                    team['data_type'] = 'team'
                all_data.extend(teams)
                
                # Fetch users (only on full sync)
                self.logger.info("Fetching Linear users...")
                users = self.client.get_users()
                for user in users:
                    user['data_type'] = 'user'
                all_data.extend(users)
            
            self.logger.info(f"Fetched {len(all_data)} items from Linear")
            return all_data
            
        except Exception as e:
            self.logger.error(f"Failed to fetch Linear data: {e}")
            raise ImportError(f"Linear data fetch failed: {e}")
    
    def transform_data(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform Linear data into internal format.
        
        Args:
            raw_data: Raw data from Linear
            
        Returns:
            Transformed data ready for storage
        """
        transformed_data = []
        
        for item in raw_data:
            try:
                data_type = item.get('data_type')
                
                if data_type == 'issue':
                    transformed_item = self._transform_issue(item)
                elif data_type == 'project':
                    transformed_item = self._transform_project(item)
                elif data_type == 'team':
                    transformed_item = self._transform_team(item)
                elif data_type == 'user':
                    transformed_item = self._transform_user(item)
                else:
                    self.logger.warning(f"Unknown data type: {data_type}")
                    continue
                
                transformed_data.append(transformed_item)
                
            except Exception as e:
                self.logger.error(f"Failed to transform item {item.get('id', 'unknown')}: {e}")
                continue
        
        self.logger.info(f"Transformed {len(transformed_data)} items")
        return transformed_data
    
    def _transform_issue(self, issue: Dict[str, Any]) -> Dict[str, Any]:
        """Transform a Linear issue."""
        return {
            'source': 'linear',
            'data_type': 'issue',
            'external_id': issue['id'],
            'identifier': issue.get('identifier'),
            'title': issue.get('title'),
            'description': issue.get('description'),
            'priority': issue.get('priority'),
            'estimate': issue.get('estimate'),
            'state': issue.get('state', {}).get('name'),
            'state_type': issue.get('state', {}).get('type'),
            'team_id': issue.get('team', {}).get('id'),
            'team_name': issue.get('team', {}).get('name'),
            'team_key': issue.get('team', {}).get('key'),
            'assignee_id': issue.get('assignee', {}).get('id'),
            'assignee_name': issue.get('assignee', {}).get('name'),
            'assignee_email': issue.get('assignee', {}).get('email'),
            'creator_id': issue.get('creator', {}).get('id'),
            'creator_name': issue.get('creator', {}).get('name'),
            'creator_email': issue.get('creator', {}).get('email'),
            'project_id': issue.get('project', {}).get('id'),
            'project_name': issue.get('project', {}).get('name'),
            'cycle_id': issue.get('cycle', {}).get('id'),
            'cycle_name': issue.get('cycle', {}).get('name'),
            'cycle_number': issue.get('cycle', {}).get('number'),
            'labels': [label['name'] for label in issue.get('labels', {}).get('nodes', [])],
            'created_at': self._parse_datetime(issue.get('createdAt')),
            'updated_at': self._parse_datetime(issue.get('updatedAt')),
            'completed_at': self._parse_datetime(issue.get('completedAt')),
            'canceled_at': self._parse_datetime(issue.get('canceledAt')),
            'raw_data': issue
        }
    
    def _transform_project(self, project: Dict[str, Any]) -> Dict[str, Any]:
        """Transform a Linear project."""
        return {
            'source': 'linear',
            'data_type': 'project',
            'external_id': project['id'],
            'name': project.get('name'),
            'description': project.get('description'),
            'state': project.get('state'),
            'priority': project.get('priority'),
            'progress': project.get('progress'),
            'lead_id': project.get('lead', {}).get('id'),
            'lead_name': project.get('lead', {}).get('name'),
            'lead_email': project.get('lead', {}).get('email'),
            'teams': [team['name'] for team in project.get('teams', {}).get('nodes', [])],
            'members': [member['name'] for member in project.get('members', {}).get('nodes', [])],
            'created_at': self._parse_datetime(project.get('createdAt')),
            'updated_at': self._parse_datetime(project.get('updatedAt')),
            'started_at': self._parse_datetime(project.get('startedAt')),
            'completed_at': self._parse_datetime(project.get('completedAt')),
            'canceled_at': self._parse_datetime(project.get('canceledAt')),
            'target_date': self._parse_datetime(project.get('targetDate')),
            'raw_data': project
        }
    
    def _transform_team(self, team: Dict[str, Any]) -> Dict[str, Any]:
        """Transform a Linear team."""
        return {
            'source': 'linear',
            'data_type': 'team',
            'external_id': team['id'],
            'name': team.get('name'),
            'key': team.get('key'),
            'description': team.get('description'),
            'organization_id': team.get('organization', {}).get('id'),
            'organization_name': team.get('organization', {}).get('name'),
            'members': [member['name'] for member in team.get('members', {}).get('nodes', [])],
            'created_at': self._parse_datetime(team.get('createdAt')),
            'updated_at': self._parse_datetime(team.get('updatedAt')),
            'raw_data': team
        }
    
    def _transform_user(self, user: Dict[str, Any]) -> Dict[str, Any]:
        """Transform a Linear user."""
        return {
            'source': 'linear',
            'data_type': 'user',
            'external_id': user['id'],
            'name': user.get('name'),
            'email': user.get('email'),
            'display_name': user.get('displayName'),
            'avatar_url': user.get('avatarUrl'),
            'active': user.get('active'),
            'admin': user.get('admin'),
            'created_at': self._parse_datetime(user.get('createdAt')),
            'updated_at': self._parse_datetime(user.get('updatedAt')),
            'raw_data': user
        }
    
    def _parse_datetime(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse ISO datetime string."""
        if not date_str:
            return None
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return None
    
    def store_data(self, transformed_data: List[Dict[str, Any]]) -> int:
        """Store transformed data in the database.
        
        Args:
            transformed_data: Data ready for storage
            
        Returns:
            Number of items stored
        """
        # For now, we'll just log the data
        # In a real implementation, this would store to the database
        stored_count = 0
        
        for item in transformed_data:
            try:
                # TODO: Implement actual database storage
                self.logger.debug(f"Would store {item['data_type']}: {item.get('title', item.get('name', item['external_id']))}")
                stored_count += 1
            except Exception as e:
                self.logger.error(f"Failed to store item {item.get('external_id', 'unknown')}: {e}")
        
        self.logger.info(f"Stored {stored_count} Linear items")
        return stored_count
