using AutoMapper;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services
{
    public sealed class IndividualService : IIndividualService
    {
        #region Properties

        /// <summary>
        /// Repository object created to access the Individual registers on database using EntityFramework.
        /// </summary>
        private readonly IRepository<Individual> _repository;
        private readonly IMapper _mapper;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// IndividualService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        /// <param name="repository">IRepository<Individual> object used to initialize the internal variable using Dependency Injection.</param>
        public IndividualService(IRepository<Individual> repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<ClientDto>> Add(ClientDto clientDto)
        {
            WebApiResponse<ClientDto> result = new();

            try
            {
                var clientEntity = _mapper.Map<Individual>(clientDto);
                var individualDuplicatedMessage = await CheckIfIndividualIsDuplicatedAndGetErrorMessage(clientEntity);

                if (!string.IsNullOrEmpty(individualDuplicatedMessage))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = individualDuplicatedMessage;
                    return result;
                }

                await _repository.AddAsync(clientEntity);

                result.Data = clientDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Cliente {clientDto.Name} cadastrado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível cadastrar o Cliente {clientDto.Name} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<ClientDto>> Update(ClientDto clientDto)
        {
            WebApiResponse<ClientDto> result = new();

            try
            {
                var clientEntity = _mapper.Map<Individual>(clientDto);
                var IndividualDuplicatedMessage = await CheckIfIndividualIsDuplicatedAndGetErrorMessage(clientEntity);

                if (!string.IsNullOrEmpty(IndividualDuplicatedMessage))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = IndividualDuplicatedMessage;
                    return result;
                }

                await _repository.UpdateAsync(clientEntity);

                result.Data = clientDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Cliente {clientDto.Name} atualizado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível atualizar os dados do Cliente {clientDto.Name} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<ClientDto>> Remove(ClientDto clientDto)
        {
            WebApiResponse<ClientDto> result = new();

            try
            {
                var clientEntity = _mapper.Map<Individual>(clientDto);
                await _repository.RemoveAsync(clientEntity);

                result.Data = clientDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Cliente {clientDto.Name} removido com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível remover o Cliente {clientDto.Name} da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<ClientDto>>> FindAll()
        {
            WebApiResponse<IEnumerable<ClientDto>> result = new();

            try
            {
                var clientEntityList = await _repository.GetAllAsync();
                result.Data = _mapper.Map<IEnumerable<ClientDto>>(clientEntityList);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ??0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<ClientDto>> FindById(int? id)
        {
            WebApiResponse<ClientDto> result = new();

            try
            {
                var clientEntity = await _repository.GetByIdAsync(id);
                result.Data = _mapper.Map<ClientDto>(clientEntity);
                result.Status = ResponseStatus.Success;
                result.Message = result.Data != null
                    ? $"Cliente {result.Data.Name} encontrado com sucesso"
                    : $"Nenhum Cliente com o ID {id} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<ClientDto>> FindByEmail(string email)
        {
            WebApiResponse<ClientDto> result = new();

            try
            {
                var clientEntity = await _repository.FirstOrDefaultAsync(_ => _.Email.Equals(email));
                result.Data = _mapper.Map<ClientDto>(clientEntity);
                result.Status = ResponseStatus.Success;
                result.Message = result.Data != null
                    ? $"Cliente {result.Data.Name} encontrado com sucesso."
                    : $"Nenhum Cliente com o E-mail {email} foi encontrado.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<ClientDto>> FindBySocialSecurityCard(string socialSecurityCard)
        {
            WebApiResponse<ClientDto> result = new();

            try
            {
                var clientEntity = await _repository.FirstOrDefaultAsync(_ => _.SocialSecurityCard.Equals(socialSecurityCard));
                result.Data = _mapper.Map<ClientDto>(clientEntity);
                result.Status = ResponseStatus.Success;
                result.Message = result.Data != null
                    ? $"Cliente {result.Data.Name} encontrado com sucesso."
                    : $"Nenhum Cliente com o CPF {socialSecurityCard} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods

        #region Private methods

        /// <summary>
        /// Should verify if the Individual is already being registered on the database.
        /// </summary>
        /// <param name="individual">The Individual object that is being added or updated.</param>
        /// <returns>The error message when Individual is duplicated. Otherwise an empty string.</returns>
        private async Task<string> CheckIfIndividualIsDuplicatedAndGetErrorMessage(Individual individual)
        {
            if (await IsNameDuplicated(individual))
            {
                return $"Já existe um Cliente cadastrado com Nome {individual.Name}.";
            }

            if (await IsEmailDuplicated(individual))
            {
                return $"Já existe um Cliente cadastrado com E-mail {individual.Email}.";
            }

            if (await IsSocialSecurityCardDuplicated(individual))
            {
                return $"Já existe um Cliente cadastrado com o CPF {individual.SocialSecurityCard}.";
            }

            if (await IsNationalIDCardDuplicated(individual))
            {
                return $"Já existe um Cliente cadastrado com o RG {individual.NationalIdCard}.";
            }

            return string.Empty;
        }

        /// <summary>
        /// Should verify if the Individual email is already being used by another register on the database.
        /// </summary>
        /// <param name="individual">The Individual object that is being added or updated.</param>
        /// <returns>True when the Email is duplicated; Otherwise false.</returns>
        private async Task<bool> IsEmailDuplicated(Individual individual)
        {
            return await _repository
                .AnyAsync(_ => _.Id != individual.Id && !string.IsNullOrEmpty(_.Email) && _.Email == individual.Email);
        }

        /// <summary>
        /// Should verify if the Individual name is already being used by another register on the database.
        /// </summary>
        /// <param name="individual">The Individual object that is being added or updated.</param>
        /// <returns>True when the Name is duplicated; Otherwise false.</returns>
        private async Task<bool> IsNameDuplicated(Individual individual)
        {
            return await _repository
                .AnyAsync(_ => _.Id != individual.Id && _.Name == individual.Name);
        }

        /// <summary>
        /// Should verify if the Individual NationalIDCard is already being used by another register on the database.
        /// </summary>
        /// <param name="individual">The Individual object that is being added or updated.</param>
        /// <returns>True when the NationalIDCard is duplicated; Otherwise false.</returns>
        private async Task<bool> IsNationalIDCardDuplicated(Individual individual)
        {
            return await _repository
                .AnyAsync(_ => _.Id != individual.Id && !string.IsNullOrEmpty(_.NationalIdCard) &&
                            _.NationalIdCard == individual.NationalIdCard);
        }

        /// <summary>
        /// Should verify if the Individual SocialSecurityCard is already being used by another register on the database.
        /// </summary>
        /// <param name="individual">The Individual object that is being added or updated.</param>
        /// <returns>True when the SocialSecurityCard is duplicated; Otherwise false.</returns>
        private async Task<bool> IsSocialSecurityCardDuplicated(Individual individual)
        {
            return await _repository
                .AnyAsync(_ => _.Id != individual.Id && !string.IsNullOrEmpty(_.SocialSecurityCard) &&
                            _.SocialSecurityCard == individual.SocialSecurityCard);
        }

        #endregion Private methods
    }
}
