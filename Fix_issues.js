openapi: 3.1.0

info:
  title: GitHub Issue Assistant  
  description: API to interface with and configure GitHub issue bot  
  version: 1.0.0

servers:
  - url: https://api.issue-bot.com/v1

paths:
  /analyze: 
    post:
      description: Analyze GitHub issue
      requestBody:
        content:
          application/json:    
            schema:       
              $ref: '#/components/schemas/AnalyzeIssueRequest'
      responses:
        200:
          description: Analysis result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AnalyzeIssueResponse'
                  
  /issues:
    get:
      description: List analyzed issues
      parameters:
        - in: query
          name: updated_since 
          schema:
            type: string
            format: date-time
      responses:  
        200:
          description: paginated list of issues
          content:
            application/json:  
              schema:
                $ref: '#/components/schemas/AnalyzeIssueList'
                
  /fixes:
    post:
      description: Apply automated fix  
      requestBody:  
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApplyIssueFixRequest'
      responses:
        200:  
          description: Result of fix applied
          content:
            application/json:
              schema: 
                $ref: '#/components/schemas/ApplyIssueFixResponse'  

components:
  schemas:

    AnalyzeIssueRequest:
      type: object
      required:
        - repository_id
        - issue_id 
    
    AnalyzeIssueResponse:
      type: object
      properties:
        classification: 
          type: string
          enum: [bug, feature, question]
        parsed_details:
          type: object
        confidence:
          type: number
          format: float
    
    ApplyIssueFixRequest:
      type: object
      required:
        - issue_id
        - fix_type
    
    ApplyIssueFixResponse: 
      type: object
      properties:
        resolution:
          type: boolean
        message:
          type: string
          
    AnalyzeIssueList:
      type: array
      items:
        $ref: '#/components/schemas/AnalyzeIssueSummary'

    AnalyzeIssueSummary: 
      type: object
      properties:  
        id: 
          type: integer  
        type:
          $ref: '#/components/schemas/AnalyzeIssueResponse/properties/classification'
   
