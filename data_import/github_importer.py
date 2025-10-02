"""
GitHub data importer for syncing GitHub repository data.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from .base_importer import BaseImporter
from .github_client import GitHubClient
from .config import ImportConfig
from .exceptions import ImportError


class GitHubImporter(BaseImporter):
    """Importer for GitHub repository data."""
    
    def __init__(self, config: ImportConfig):
        """Initialize the GitHub importer.
        
        Args:
            config: Import configuration
        """
        super().__init__(config, 'github')
        
        service_config = config.get_service_config('github')
        self.client = GitHubClient(
            token=service_config['token'],
            org=service_config.get('org'),
            timeout=service_config['timeout']
        )
        
        # Test connection on initialization
        if not self.client.test_connection():
            raise ImportError("Failed to connect to GitHub API")
    
    def fetch_data(self, since: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Fetch data from GitHub.
        
        Args:
            since: Only fetch data modified since this timestamp
            
        Returns:
            List of data items from GitHub
        """
        all_data = []
        
        try:
            # Fetch repositories
            self.logger.info("Fetching GitHub repositories...")
            repositories = self.client.get_repositories(since=since)
            
            for repo in repositories:
                repo['data_type'] = 'repository'
                all_data.append(repo)
                
                # For each repository, fetch issues and PRs
                repo_name = repo['full_name']
                
                try:
                    # Fetch issues (including PRs, as GitHub treats PRs as issues)
                    self.logger.info(f"Fetching issues for {repo_name}...")
                    issues = self.client.get_issues(repo_name, since=since, limit=50)
                    
                    for issue in issues:
                        issue['data_type'] = 'pull_request' if 'pull_request' in issue else 'issue'
                        issue['repository'] = repo_name
                        all_data.append(issue)
                    
                    # Fetch recent commits (only for active repos)
                    if since is None or repo.get('pushed_at'):  # Only if repo has recent activity
                        self.logger.info(f"Fetching commits for {repo_name}...")
                        commits = self.client.get_commits(repo_name, since=since, limit=20)
                        
                        for commit in commits:
                            commit['data_type'] = 'commit'
                            commit['repository'] = repo_name
                            all_data.append(commit)
                
                except Exception as e:
                    self.logger.warning(f"Failed to fetch data for repository {repo_name}: {e}")
                    continue
            
            # Fetch organization members (only on full sync)
            if since is None and self.client.org:
                try:
                    self.logger.info("Fetching organization members...")
                    members = self.client.get_organization_members()
                    
                    for member in members:
                        member['data_type'] = 'user'
                        all_data.append(member)
                        
                except Exception as e:
                    self.logger.warning(f"Failed to fetch organization members: {e}")
            
            self.logger.info(f"Fetched {len(all_data)} items from GitHub")
            return all_data
            
        except Exception as e:
            self.logger.error(f"Failed to fetch GitHub data: {e}")
            raise ImportError(f"GitHub data fetch failed: {e}")
    
    def transform_data(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform GitHub data into internal format.
        
        Args:
            raw_data: Raw data from GitHub
            
        Returns:
            Transformed data ready for storage
        """
        transformed_data = []
        
        for item in raw_data:
            try:
                data_type = item.get('data_type')
                
                if data_type == 'repository':
                    transformed_item = self._transform_repository(item)
                elif data_type == 'issue':
                    transformed_item = self._transform_issue(item)
                elif data_type == 'pull_request':
                    transformed_item = self._transform_pull_request(item)
                elif data_type == 'commit':
                    transformed_item = self._transform_commit(item)
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
    
    def _transform_repository(self, repo: Dict[str, Any]) -> Dict[str, Any]:
        """Transform a GitHub repository."""
        return {
            'source': 'github',
            'data_type': 'repository',
            'external_id': str(repo['id']),
            'name': repo.get('name'),
            'full_name': repo.get('full_name'),
            'description': repo.get('description'),
            'private': repo.get('private', False),
            'fork': repo.get('fork', False),
            'language': repo.get('language'),
            'stars': repo.get('stargazers_count', 0),
            'forks': repo.get('forks_count', 0),
            'open_issues': repo.get('open_issues_count', 0),
            'size': repo.get('size', 0),
            'default_branch': repo.get('default_branch'),
            'owner_login': repo.get('owner', {}).get('login'),
            'owner_type': repo.get('owner', {}).get('type'),
            'html_url': repo.get('html_url'),
            'clone_url': repo.get('clone_url'),
            'created_at': self._parse_datetime(repo.get('created_at')),
            'updated_at': self._parse_datetime(repo.get('updated_at')),
            'pushed_at': self._parse_datetime(repo.get('pushed_at')),
            'raw_data': repo
        }
    
    def _transform_issue(self, issue: Dict[str, Any]) -> Dict[str, Any]:
        """Transform a GitHub issue."""
        return {
            'source': 'github',
            'data_type': 'issue',
            'external_id': str(issue['id']),
            'number': issue.get('number'),
            'title': issue.get('title'),
            'body': issue.get('body'),
            'state': issue.get('state'),
            'locked': issue.get('locked', False),
            'comments_count': issue.get('comments', 0),
            'repository': issue.get('repository'),
            'user_login': issue.get('user', {}).get('login'),
            'user_type': issue.get('user', {}).get('type'),
            'assignee_login': issue.get('assignee', {}).get('login') if issue.get('assignee') else None,
            'labels': [label['name'] for label in issue.get('labels', [])],
            'milestone': issue.get('milestone', {}).get('title') if issue.get('milestone') else None,
            'html_url': issue.get('html_url'),
            'created_at': self._parse_datetime(issue.get('created_at')),
            'updated_at': self._parse_datetime(issue.get('updated_at')),
            'closed_at': self._parse_datetime(issue.get('closed_at')),
            'raw_data': issue
        }
    
    def _transform_pull_request(self, pr: Dict[str, Any]) -> Dict[str, Any]:
        """Transform a GitHub pull request."""
        return {
            'source': 'github',
            'data_type': 'pull_request',
            'external_id': str(pr['id']),
            'number': pr.get('number'),
            'title': pr.get('title'),
            'body': pr.get('body'),
            'state': pr.get('state'),
            'draft': pr.get('draft', False),
            'merged': pr.get('merged', False),
            'mergeable': pr.get('mergeable'),
            'comments_count': pr.get('comments', 0),
            'commits_count': pr.get('commits', 0),
            'additions': pr.get('additions', 0),
            'deletions': pr.get('deletions', 0),
            'changed_files': pr.get('changed_files', 0),
            'repository': pr.get('repository'),
            'user_login': pr.get('user', {}).get('login'),
            'head_ref': pr.get('head', {}).get('ref'),
            'head_sha': pr.get('head', {}).get('sha'),
            'base_ref': pr.get('base', {}).get('ref'),
            'base_sha': pr.get('base', {}).get('sha'),
            'labels': [label['name'] for label in pr.get('labels', [])],
            'milestone': pr.get('milestone', {}).get('title') if pr.get('milestone') else None,
            'html_url': pr.get('html_url'),
            'created_at': self._parse_datetime(pr.get('created_at')),
            'updated_at': self._parse_datetime(pr.get('updated_at')),
            'closed_at': self._parse_datetime(pr.get('closed_at')),
            'merged_at': self._parse_datetime(pr.get('merged_at')),
            'raw_data': pr
        }
    
    def _transform_commit(self, commit: Dict[str, Any]) -> Dict[str, Any]:
        """Transform a GitHub commit."""
        commit_data = commit.get('commit', {})
        author = commit_data.get('author', {})
        committer = commit_data.get('committer', {})
        
        return {
            'source': 'github',
            'data_type': 'commit',
            'external_id': commit['sha'],
            'sha': commit['sha'],
            'message': commit_data.get('message'),
            'repository': commit.get('repository'),
            'author_name': author.get('name'),
            'author_email': author.get('email'),
            'author_date': self._parse_datetime(author.get('date')),
            'committer_name': committer.get('name'),
            'committer_email': committer.get('email'),
            'committer_date': self._parse_datetime(committer.get('date')),
            'user_login': commit.get('author', {}).get('login') if commit.get('author') else None,
            'html_url': commit.get('html_url'),
            'raw_data': commit
        }
    
    def _transform_user(self, user: Dict[str, Any]) -> Dict[str, Any]:
        """Transform a GitHub user."""
        return {
            'source': 'github',
            'data_type': 'user',
            'external_id': str(user['id']),
            'login': user.get('login'),
            'name': user.get('name'),
            'email': user.get('email'),
            'bio': user.get('bio'),
            'company': user.get('company'),
            'location': user.get('location'),
            'blog': user.get('blog'),
            'twitter_username': user.get('twitter_username'),
            'public_repos': user.get('public_repos', 0),
            'public_gists': user.get('public_gists', 0),
            'followers': user.get('followers', 0),
            'following': user.get('following', 0),
            'avatar_url': user.get('avatar_url'),
            'html_url': user.get('html_url'),
            'type': user.get('type'),
            'site_admin': user.get('site_admin', False),
            'created_at': self._parse_datetime(user.get('created_at')),
            'updated_at': self._parse_datetime(user.get('updated_at')),
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
                item_name = item.get('title', item.get('name', item.get('message', item['external_id'])))
                self.logger.debug(f"Would store {item['data_type']}: {item_name}")
                stored_count += 1
            except Exception as e:
                self.logger.error(f"Failed to store item {item.get('external_id', 'unknown')}: {e}")
        
        self.logger.info(f"Stored {stored_count} GitHub items")
        return stored_count
