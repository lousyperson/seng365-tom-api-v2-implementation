module.exports = {
    "type": [
        "object"
    ],
    "definitions": {
        "ProjectsOverview": {
            "type": "array",
            "items": {
                "type": "object",
                "required": [
                    "id",
                    "title",
                    "subtitle",
                    "open"
                ],
                "description": "Used for the GET - projects/ endpoint. This contains a subset of the project data.",
                "properties": {
                    "id": {
                        "type": "integer"
                    },
                    "title": {
                        "type": "string"
                    },
                    "subtitle": {
                        "type": "string"
                    },
                    "open": {
                        "type": "boolean"
                    },
                    "imageUri": {
                        "type": "string"
                    }
                }
            }
        },
        "ProjectDetails": {
            "type": "object",
            "description": "object containing project with dynamic content (backers, progress, rewards)",
            "required": [
                "id",
                "creationDate",
                "open",
                "title",
                "subtitle",
                "description",
                "creators",
                "target"
            ],
            "properties": {
                "id": {
                    "type": "integer"
                },
                "title": {
                    "type": "string"
                },
                "subtitle": {
                    "type": "string"
                },
                "description": {
                    "type": "string"
                },
                "creationDate": {
                    "type": "integer",
                    "description": "number of milliseconds since January 1, 1970, 00:00:00 UTC"
                },
                "open": {
                    "type": "boolean"
                },
                "imageUri": {
                    "type": "string"
                },
                "target": {
                    "type": "integer",
                    "description": "target amount in cents"
                },
                "creators": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "integer",
                                "description": "id field from User"
                            },
                            "username": {
                                "type": "string",
                                "description": "username field from User"
                            }
                        }
                    }
                },
                "rewards": {
                    "$ref": "#/definitions/Rewards"
                },
                "progress": {
                    "$ref": "#/definitions/Progress"
                },
                "backers": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "integer",
                                "description": "id of the user who has backed the project"
                            },
                            "username": {
                                "type": "string",
                                "description": "username of the backer, \"anonymous\" if pledge made anonymously"
                            },
                            "amount": {
                                "type": "integer"
                            }
                        }
                    }
                }
            }
        },
        "ProjectCreation": {
            "type": "object",
            "description": "object containing raw project data.",
            "required": [
                "title",
                "subtitle",
                "description",
                "creators",
                "target"
            ],
            "properties": {
                "title": {
                    "type": "string"
                },
                "subtitle": {
                    "type": "string"
                },
                "description": {
                    "type": "string"
                },
                "target": {
                    "type": "integer",
                    "description": "target amount in cents"
                },
                "creators": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "integer"
                            }
                        }
                    }
                },
                "rewards": {
                    "$ref": "#/definitions/RewardsCreation"
                }
            }
        },
        "Progress": {
            "type": "object",
            "properties": {
                "target": {
                    "type": "integer"
                },
                "currentPledged": {
                    "type": "integer"
                },
                "numberOfBackers": {
                    "type": "integer",
                    "description": "total of all named and anonymous backers"
                }
            }
        },
        "Rewards": {
            "type": "array",
            "items": {
                "type": "object",
                "description": "a project reward",
                "properties": {
                    "id": {
                        "type": "integer",
                        "description": "id of the reward"
                    },
                    "amount": {
                        "type": "integer",
                        "description": "reward amount in cents"
                    },
                    "description": {
                        "type": "string",
                        "description": "reward description"
                    }
                }
            }
        },
        "RewardsCreation": {
            "type": "array",
            "items": {
                "type": "object",
                "description": "a project reward",
                "properties": {
                    "amount": {
                        "type": "integer",
                        "description": "reward amount in cents"
                    },
                    "description": {
                        "type": "string",
                        "description": "reward description"
                    }
                }
            }
        },
        "Pledge": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "integer",
                    "description": "id of the backer"
                },
                "amount": {
                    "type": "integer",
                    "description": "pledge amount in cents"
                },
                "anonymous": {
                    "type": "boolean",
                    "description": "hide the username"
                },
                "card": {
                    "$ref": "#/definitions/CreditCard"
                }
            }
        },
        "CreditCard": {
            "type": "object",
            "properties": {
                "authToken": {
                    "type": "string",
                    "description": "token"
                }
            }
        },
        "User": {
            "type": "object",
            "properties": {
                "username": {
                    "type": "string"
                },
                "location": {
                    "type": "string"
                },
                "email": {
                    "type": "string"
                },
                "password": {
                    "type": "string"
                }
            }
        },
        "PublicUser": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "integer"
                },
                "username": {
                    "type": "string"
                },
                "location": {
                    "type": "string"
                },
                "email": {
                    "type": "string"
                }
            }
        },
        "LogInResponse": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "integer",
                    "description": "the id of the logged in user"
                },
                "token": {
                    "type": "string",
                    "description": "a token to be used for future calls"
                }
            }
        }
    }
};
